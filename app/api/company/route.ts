import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchJobsFromSerpApi } from "@/lib/job-sources/serpapi";
import { extractTechStack } from "@/lib/analyzer";
import { enrichCompanyFromWeb } from "@/lib/company-enrichment";
import { extractCompanyName, extractDomain, getConfidence } from "@/lib/utils";

// Allow up to 90 seconds for SerpAPI + Claude calls (enrichment runs in parallel)
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyUrl } = body;

    if (!companyUrl || typeof companyUrl !== "string") {
      return NextResponse.json(
        { error: "companyUrl is required" },
        { status: 400 }
      );
    }

    const domain = extractDomain(companyUrl);
    const companyName = extractCompanyName(domain);
    const supabase = await createClient();

    // Check cache first
    const { data: cached } = await supabase
      .from("company_intel_analyses")
      .select("*")
      .eq("company_domain", domain)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      return NextResponse.json({
        company: cached.company_name || companyName,
        domain: cached.company_domain,
        tech_stack: cached.tech_stack || {},
        summary: cached.summary || "",
        jobs_analyzed: cached.jobs_analyzed || 0,
        confidence: cached.confidence,
        cached: true,
        // Include enrichment fields from firmographics if stored
        products: cached.firmographics?.products || [],
        services: cached.firmographics?.services || [],
        industry: cached.firmographics?.industry || "",
        competitors: cached.firmographics?.competitors || [],
        recent_news: cached.firmographics?.recent_news || [],
        ai_adoption: cached.firmographics?.ai_adoption || "",
        actionable_insights: cached.firmographics?.actionable_insights || [],
        employee_count_estimate: cached.firmographics?.employee_count_estimate || "",
        founded_year: cached.firmographics?.founded_year || null,
        headquarters: cached.firmographics?.headquarters || null,
        enrichment_source: cached.jobs_analyzed > 0 ? "jobs_and_web" : "web_scrape",
      });
    }

    // Try SerpAPI job listings first (best for large companies)
    let jobs: Awaited<ReturnType<typeof fetchJobsFromSerpApi>> = [];
    try {
      jobs = await fetchJobsFromSerpApi(companyName);
    } catch (e) {
      console.log("[company] SerpAPI failed, will use web enrichment fallback:", e);
    }

    // Always run web enrichment for company context (products, competitors, etc.)
    // Run in parallel with job analysis if jobs exist
    const enrichmentPromise = enrichCompanyFromWeb(domain, companyName);

    if (jobs.length > 0) {
      // ── Path A: Job analysis + web enrichment (in parallel) ──
      const [extraction, enrichment] = await Promise.all([
        extractTechStack(jobs, companyName),
        enrichmentPromise,
      ]);

      const confidence = getConfidence(jobs.length);
      const displayName = enrichment.company_name || companyName.charAt(0).toUpperCase() + companyName.slice(1);

      // Merge tech stacks: job analysis is primary, enrichment fills gaps
      const mergedTechStack = { ...extraction.tech_stack };
      for (const [category, techs] of Object.entries(enrichment.tech_stack)) {
        if (!mergedTechStack[category]) {
          mergedTechStack[category] = techs;
        } else {
          // Add enrichment techs that aren't already in the job-based list
          const existing = new Set(mergedTechStack[category].map((t: string) => t.toLowerCase()));
          for (const tech of techs) {
            if (!existing.has(tech.toLowerCase())) {
              mergedTechStack[category].push(tech);
            }
          }
        }
      }

      // Build rich summary combining job analysis + enrichment
      let richSummary = enrichment.summary || extraction.summary;
      if (enrichment.products.length > 0 && !richSummary.includes("Products:")) {
        richSummary += ` Products: ${enrichment.products.join(", ")}.`;
      }

      // Store enrichment data in firmographics column
      const firmographics = {
        products: enrichment.products,
        services: enrichment.services,
        industry: enrichment.industry,
        competitors: enrichment.competitors,
        recent_news: enrichment.recent_news,
        ai_adoption: enrichment.ai_adoption,
        actionable_insights: enrichment.actionable_insights,
        employee_count_estimate: enrichment.employee_count_estimate,
        founded_year: enrichment.founded_year,
        headquarters: enrichment.headquarters,
      };

      await supabase.from("company_intel_analyses").upsert(
        {
          company_domain: domain,
          company_name: displayName,
          tech_stack: mergedTechStack,
          summary: richSummary,
          jobs_analyzed: jobs.length,
          job_titles_sampled: [...new Set(jobs.map((j) => j.title))].slice(0, 20),
          confidence,
          firmographics,
          analyzed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "company_domain" }
      );

      return NextResponse.json({
        company: displayName,
        domain,
        tech_stack: mergedTechStack,
        summary: richSummary,
        jobs_analyzed: jobs.length,
        confidence,
        cached: false,
        enrichment_source: "jobs_and_web",
        products: enrichment.products,
        services: enrichment.services,
        industry: enrichment.industry,
        competitors: enrichment.competitors,
        recent_news: enrichment.recent_news,
        ai_adoption: enrichment.ai_adoption,
        actionable_insights: enrichment.actionable_insights,
        employee_count_estimate: enrichment.employee_count_estimate,
        founded_year: enrichment.founded_year,
        headquarters: enrichment.headquarters,
      });
    }

    // ── Path B: Web enrichment only (for small companies, startups) ──
    console.log(`[company] No job listings for "${companyName}" — using web enrichment`);

    const enrichment = await enrichmentPromise;

    // Build a rich summary
    let richSummary = enrichment.summary;
    if (enrichment.products.length > 0) {
      richSummary += ` Products: ${enrichment.products.join(", ")}.`;
    }
    if (enrichment.services.length > 0) {
      richSummary += ` Services: ${enrichment.services.join(", ")}.`;
    }

    const firmographics = {
      products: enrichment.products,
      services: enrichment.services,
      industry: enrichment.industry,
      competitors: enrichment.competitors,
      recent_news: enrichment.recent_news,
      ai_adoption: enrichment.ai_adoption,
      actionable_insights: enrichment.actionable_insights,
      employee_count_estimate: enrichment.employee_count_estimate,
      founded_year: enrichment.founded_year,
      headquarters: enrichment.headquarters,
    };

    await supabase.from("company_intel_analyses").upsert(
      {
        company_domain: domain,
        company_name: enrichment.company_name,
        tech_stack: enrichment.tech_stack,
        summary: richSummary,
        jobs_analyzed: 0,
        job_titles_sampled: [],
        confidence: enrichment.confidence,
        firmographics,
        analyzed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "company_domain" }
    );

    return NextResponse.json({
      company: enrichment.company_name,
      domain,
      tech_stack: enrichment.tech_stack,
      summary: richSummary,
      jobs_analyzed: 0,
      confidence: enrichment.confidence,
      cached: false,
      enrichment_source: "web_scrape",
      products: enrichment.products,
      services: enrichment.services,
      industry: enrichment.industry,
      competitors: enrichment.competitors,
      recent_news: enrichment.recent_news,
      ai_adoption: enrichment.ai_adoption,
      actionable_insights: enrichment.actionable_insights,
      employee_count_estimate: enrichment.employee_count_estimate,
      founded_year: enrichment.founded_year,
      headquarters: enrichment.headquarters,
    });
  } catch (error) {
    console.error("Company analysis error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "domain query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data } = await supabase
      .from("company_intel_analyses")
      .select("*")
      .eq("company_domain", domain)
      .single();

    if (!data) {
      return NextResponse.json(
        { error: "No analysis found for this domain" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      company: data.company_name,
      domain: data.company_domain,
      tech_stack: data.tech_stack,
      summary: data.summary,
      jobs_analyzed: data.jobs_analyzed,
      confidence: data.confidence,
      products: data.firmographics?.products || [],
      services: data.firmographics?.services || [],
      industry: data.firmographics?.industry || "",
      competitors: data.firmographics?.competitors || [],
      recent_news: data.firmographics?.recent_news || [],
      ai_adoption: data.firmographics?.ai_adoption || "",
      actionable_insights: data.firmographics?.actionable_insights || [],
      employee_count_estimate: data.firmographics?.employee_count_estimate || "",
      founded_year: data.firmographics?.founded_year || null,
      headquarters: data.firmographics?.headquarters || null,
    });
  } catch (error) {
    console.error("Company fetch error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
