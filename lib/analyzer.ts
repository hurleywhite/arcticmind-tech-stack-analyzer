import Anthropic from "@anthropic-ai/sdk";
import { JobListing, ClaudeExtractionResult } from "./types";

const SYSTEM_PROMPT = `You are a tech stack analyst. Given a set of job listings from a company, extract every specific technology, tool, platform, framework, programming language, and software product mentioned.

Categorize each into exactly one of these categories:
- cloud_infrastructure (AWS, GCP, Azure, Terraform, etc.)
- data_engineering (Snowflake, dbt, Airflow, Spark, etc.)
- backend (Python, Java, Go, Node.js, etc.)
- frontend (React, TypeScript, Next.js, Vue, etc.)
- mobile (Swift, Kotlin, React Native, Flutter, etc.)
- devops_ci_cd (Docker, Kubernetes, Jenkins, GitHub Actions, etc.)
- databases (PostgreSQL, MongoDB, Redis, DynamoDB, etc.)
- marketing_sales (HubSpot, Salesforce, Marketo, etc.)
- design (Figma, Sketch, Adobe XD, etc.)
- project_management (Jira, Asana, Linear, Notion, etc.)
- ai_ml (TensorFlow, PyTorch, LangChain, OpenAI, etc.)
- security (Okta, CrowdStrike, Snyk, etc.)
- communication (Slack, Teams, Zoom, etc.)
- other (anything that doesn't fit above)

Rules:
- Only extract SPECIFIC NAMED tools/technologies — not generic skills like "communication" or "teamwork"
- De-duplicate across all listings
- If a technology could fit multiple categories, pick the most specific one
- Return ONLY valid JSON, no markdown, no preamble

Respond with this exact JSON structure:
{
  "tech_stack": { ...categories with arrays of strings... },
  "summary": "2-3 sentence summary of this company's technical profile",
  "confidence": "high|medium|low"
}`;

function formatJobsForPrompt(
  jobs: JobListing[],
  companyName: string
): string {
  const formattedJobs = jobs
    .map(
      (job, i) =>
        `--- Job ${i + 1}: ${job.title} ---\nLocation: ${job.location}\n${job.description}`
    )
    .join("\n\n");

  return `Analyze these ${jobs.length} job listings from ${companyName} and extract their tech stack:\n\n${formattedJobs}`;
}

export async function extractTechStack(
  jobs: JobListing[],
  companyName: string
): Promise<ClaudeExtractionResult> {
  // CLAUDE_API_KEY preferred (avoids collision with Claude Code's own ANTHROPIC_API_KEY locally)
  // Falls back to ANTHROPIC_API_KEY for Vercel / production deployments
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No API key found. Set CLAUDE_API_KEY (or ANTHROPIC_API_KEY) in .env.local"
    );
  }

  const client = new Anthropic({ apiKey });

  const userMessage = formatJobsForPrompt(jobs, companyName);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed: ClaudeExtractionResult = JSON.parse(textBlock.text);

  // Validate the structure has all expected categories
  const expectedCategories = [
    "cloud_infrastructure",
    "data_engineering",
    "backend",
    "frontend",
    "mobile",
    "devops_ci_cd",
    "databases",
    "marketing_sales",
    "design",
    "project_management",
    "ai_ml",
    "security",
    "communication",
    "other",
  ];

  for (const cat of expectedCategories) {
    if (!Array.isArray(parsed.tech_stack[cat as keyof typeof parsed.tech_stack])) {
      parsed.tech_stack[cat as keyof typeof parsed.tech_stack] = [];
    }
  }

  return parsed;
}
