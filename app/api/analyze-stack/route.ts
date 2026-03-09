import { NextRequest, NextResponse } from "next/server";
import { fetchJobsFromSerpApi } from "@/lib/job-sources/serpapi";
import { extractTechStack } from "@/lib/analyzer";
import { TechStackResult, AnalyzeRequest } from "@/lib/types";

function extractCompanyName(url: string): string {
  // Remove protocol
  let domain = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  // Remove path, query, hash
  domain = domain.split("/")[0].split("?")[0].split("#")[0];
  // Get the company name from the domain (e.g., "snowflake.com" -> "snowflake")
  const parts = domain.split(".");
  // Handle cases like "jobs.lever.co" or "boards.greenhouse.io"
  if (parts.length > 2) {
    return parts[parts.length - 2];
  }
  return parts[0];
}

function getConfidence(jobCount: number): "high" | "medium" | "low" {
  if (jobCount >= 15) return "high";
  if (jobCount >= 5) return "medium";
  return "low";
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.companyUrl || typeof body.companyUrl !== "string") {
      return NextResponse.json(
        { error: "companyUrl is required" },
        { status: 400 }
      );
    }

    const companyName = extractCompanyName(body.companyUrl.trim());
    const domain = body.companyUrl
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];

    // Fetch job listings from SerpAPI
    const jobs = await fetchJobsFromSerpApi(companyName);

    if (jobs.length === 0) {
      return NextResponse.json(
        {
          error: `No public job listings found for "${companyName}". This usually means the company isn't actively hiring on major job boards, or is too small for Google Jobs to index. Try a larger company or check that the domain is correct.`,
        },
        { status: 404 }
      );
    }

    // Extract tech stack using Claude
    const extraction = await extractTechStack(jobs, companyName);

    const result: TechStackResult = {
      company: companyName.charAt(0).toUpperCase() + companyName.slice(1),
      domain,
      tech_stack: extraction.tech_stack,
      summary: extraction.summary,
      jobs_analyzed: jobs.length,
      job_titles_sampled: [...new Set(jobs.map((j) => j.title))].slice(0, 20),
      confidence: getConfidence(jobs.length),
      last_analyzed: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
