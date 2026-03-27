import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchJobsFromSerpApi } from "@/lib/job-sources/serpapi";
import { extractTechStack } from "@/lib/analyzer";
import { enrichCompanyFromWeb } from "@/lib/company-enrichment";
import { extractCompanyName, extractDomain, getConfidence } from "@/lib/utils";

// Allow up to 60 seconds for SerpAPI + Claude calls
export const maxDuration = 60;

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
      });
    }

    // Try SerpAPI job listings first (best for large companies)
    let jobs: Awaited<ReturnType<typeof fetchJobsFromSerpApi>> = [];
    try {
      jobs = await fetchJobsFromSerpApi(companyName);
    } catch (e) {
      console.log("[company] SerpAPI failed, will use web enrichment fallback:", e);
    }

    if (jobs.length > 0) {
      // ── Path A: Job-listing analysis (original flow for larger companies) ──
      const extraction = await extractTechStack(jobs, companyName);
      const confidence = getConfidence(jobs.length);
      const displayName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

      await supabase.from("company_intel_analyses").upsert(
        {
          company_domain: domain,
          company_name: displayName,
          tech_stack: extraction.tech_stack,
          summary: extraction.summary,
          jobs_analyzed: jobs.length,
          job_titles_sampled: [...new Set(jobs.map((j) => j.title))].slice(0, 20),
          confidence,
          analyzed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "company_domain" }
      );

      return NextResponse.json({
        company: displayName,
        domain,
        tech_stack: extraction.tech_stack,
        summary: extraction.summary,
        jobs_analyzed: jobs.length,
        confidence,
        cached: false,
      });
    }

    // ── Path B: Web enrichment fallback (for small companies, startups) ──
    console.log(`[company] No job listings for "${companyName}" — using web enrichment fallback`);

    const enrichment = await enrichCompanyFromWeb(domain, companyName);

    // Build a rich summary including products and services
    let richSummary = enrichment.summary;
    if (enrichment.products.length > 0) {
      richSummary += ` Products: ${enrichment.products.join(", ")}.`;
    }
    if (enrichment.services.length > 0) {
      richSummary += ` Services: ${enrichment.services.join(", ")}.`;
    }
    if (enrichment.industry) {
      richSummary += ` Industry: ${enrichment.industry}.`;
    }

    await supabase.from("company_intel_analyses").upsert(
      {
        company_domain: domain,
        company_name: enrichment.company_name,
        tech_stack: enrichment.tech_stack,
        summary: richSummary,
        jobs_analyzed: 0,
        job_titles_sampled: [],
        confidence: enrichment.confidence,
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
    });
  } catch (error) {
    console.error("Company fetch error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
