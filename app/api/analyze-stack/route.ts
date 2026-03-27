import { NextRequest, NextResponse } from "next/server";
import { fetchJobsFromSerpApi } from "@/lib/job-sources/serpapi";
import { extractTechStack } from "@/lib/analyzer";
import { TechStackResult, AnalyzeRequest } from "@/lib/types";
import { extractCompanyName, getConfidence } from "@/lib/utils";

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
