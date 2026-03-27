import Anthropic from "@anthropic-ai/sdk";

/**
 * Fallback company enrichment via Claude web search
 * Used when SerpAPI job listings return nothing (small companies, startups, etc.)
 * Scrapes the company website + public info to build a profile
 */

interface EnrichmentResult {
  company_name: string;
  summary: string;
  products: string[];
  services: string[];
  industry: string;
  tech_stack: Record<string, string[]>;
  employee_count_estimate: string;
  founded_year: string | null;
  headquarters: string | null;
  confidence: string;
}

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No Claude API key found");
  return new Anthropic({ apiKey });
}

export async function enrichCompanyFromWeb(
  domain: string,
  companyName: string
): Promise<EnrichmentResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    tools: [{ type: "web_search_20250305" as const, name: "web_search", max_uses: 5 }],
    messages: [
      {
        role: "user",
        content: `Research the company "${companyName}" (website: ${domain}). Visit their website and find:

1. What the company does (1-2 sentence summary)
2. Their products and services (list each one)
3. Their industry/sector
4. Any technologies or tools they use or build with (check their website, blog, job postings, GitHub, etc.)
5. Approximate company size (if findable)
6. When they were founded (if findable)
7. Where they're headquartered (if findable)

Return ONLY a JSON object (no markdown, no explanation):
{
  "company_name": "Proper Name",
  "summary": "1-2 sentence description of what this company does, their main value proposition",
  "products": ["Product 1", "Product 2"],
  "services": ["Service 1", "Service 2"],
  "industry": "their industry",
  "tech_stack": {
    "ai_ml": ["tools they use or build with"],
    "backend": ["backend technologies"],
    "frontend": ["frontend technologies"],
    "databases": ["databases"],
    "cloud_infrastructure": ["cloud platforms"],
    "other": ["other notable tools"]
  },
  "employee_count_estimate": "1-10 / 11-50 / 51-200 / 201-500 / 500+",
  "founded_year": "YYYY or null",
  "headquarters": "City, State/Country or null",
  "confidence": "high/medium/low"
}

If you can't find certain information, use empty arrays or null. Focus on what's publicly available.
Return ONLY the JSON.`,
      },
    ],
  });

  // Extract text from response
  let text = "";
  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text;
    }
  }

  // Strip citation tags
  text = text.replace(/<cite[^>]*>[\s\S]*?<\/cite>/gi, "");
  text = text.replace(/<cite[^>]*\/>/gi, "");

  // Parse JSON
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        company_name: parsed.company_name || companyName,
        summary: parsed.summary || "",
        products: parsed.products || [],
        services: parsed.services || [],
        industry: parsed.industry || "technology",
        tech_stack: parsed.tech_stack || {},
        employee_count_estimate: parsed.employee_count_estimate || "unknown",
        founded_year: parsed.founded_year || null,
        headquarters: parsed.headquarters || null,
        confidence: parsed.confidence || "low",
      };
    }
  } catch (e) {
    console.error("Failed to parse enrichment JSON:", e);
  }

  // Fallback minimal result
  return {
    company_name: companyName,
    summary: `${companyName} is a company operating at ${domain}.`,
    products: [],
    services: [],
    industry: "technology",
    tech_stack: {},
    employee_count_estimate: "unknown",
    founded_year: null,
    headquarters: null,
    confidence: "low",
  };
}
