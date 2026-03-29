import Anthropic from "@anthropic-ai/sdk";
import {
  FeedItem,
  FeedData,
  CompanySection,
  UserProfile,
  CompanyAnalysisCache,
} from "./feed-types";
import {
  getSourceGuidance,
  getDepthGuidance,
  getPreferredSourceNames,
  getVendorBlogForTool,
} from "./source-catalog";
import { getMatchedCourses } from "./training-catalog";

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("No API key found. Set CLAUDE_API_KEY in .env.local");
  }
  return new Anthropic({ apiKey });
}

// Timeout wrapper — kills any Claude call that takes longer than 45 seconds
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function stripCitations(text: string): string {
  let cleaned = text.replace(/<cite[^>]*>([\s\S]*?)<\/cite>/gi, "$1");
  cleaned = cleaned.replace(/<cite[^>]*\/>/gi, "");
  cleaned = cleaned.replace(/\[citation needed\]/gi, "");
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned;
}

function extractTextFromResponse(
  response: Anthropic.Messages.Message
): string {
  const texts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") {
      texts.push(block.text);
    }
  }
  return texts.join("\n");
}

function isRecentArticle(dateStr: string, maxDaysOld: number = 14): boolean {
  if (!dateStr) return true; // Keep articles with no date rather than dropping them
  try {
    const articleDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - articleDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= maxDaysOld && diffDays >= -1; // Allow 1 day in future for timezone issues
  } catch {
    return true; // Keep if date can't be parsed
  }
}

function parseJsonFromText(text: string): FeedItem[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const items = JSON.parse(jsonMatch[0]);
      if (Array.isArray(items)) {
        return items
          .map((item: Record<string, string>) => ({
            title: stripCitations(item.title || "Untitled"),
            summary: stripCitations(item.summary || ""),
            url: item.url || "",
            source: stripCitations(item.source || ""),
            date: item.date || "",
            category: stripCitations(item.category || item.trend_category || ""),
            relevance_note: stripCitations(item.relevance_note || item.relevance_reason || item.context || ""),
          }))
          .filter((item) => isRecentArticle(item.date, 14)); // Drop anything older than 14 days
      }
    }
  } catch (e) {
    console.error("JSON parse error:", e);
  }
  return [];
}

// ─── USER CONTEXT BUILDER ───

function buildUserContext(profile: UserProfile, companyData: CompanyAnalysisCache | null): string {
  const level = profile.ai_experience_level || "intermediate";
  const depth = profile.content_depth || "balanced";
  const interests = profile.ai_interests?.length > 0
    ? profile.ai_interests.join(", ")
    : "general AI trends";

  const sourceGuidance = getSourceGuidance(level);
  const depthGuidance = getDepthGuidance(depth);

  const industry = companyData?.summary
    ? extractIndustryFromSummary(companyData.summary)
    : companyData?.firmographics?.industry || "technology";

  const preferredSources = getPreferredSourceNames(level, profile.ai_interests || []);

  let context = `USER PROFILE:
- Role: ${profile.role || "professional"}
- Seniority: ${profile.seniority || "not specified"}
- AI experience level: ${level}
- Content depth preference: ${depth}
- AI interests: ${interests}
- Industry: ${industry}
- Company: ${companyData?.company_name || profile.company_name || "not specified"}`;

  if (profile.custom_learning_focus) {
    context += `\n- Custom learning focus: "${profile.custom_learning_focus}"`;
  }

  if (profile.ai_goals?.length > 0) {
    context += `\n- AI goals: ${profile.ai_goals.join(", ")}`;
  }

  context += `

SOURCE GUIDANCE:
${sourceGuidance}
${depthGuidance}

PREFERRED SOURCES (not exclusive — use ANY reputable source):
${preferredSources.join(", ")}`;

  return context;
}

// ─── QUALITY RULES ───

function getQualityRules(): string {
  return `
CRITICAL RULES:
1. Today's date is ${getTodayDate()}. Only include articles from the last 7 days.
2. Every URL MUST be a real URL you found in search results. NEVER fabricate or guess URLs.
3. Every article must be from a credible source (established publication, official vendor blog, known independent author).
4. Strip all citation markup — no <cite> tags, no [1] references, no index markers.
5. Write summaries in plain English. Explain WHY this matters for the user, not just WHAT happened.
6. DEPRIORITIZE: content farm listicles, SEO filler, AI-generated aggregator content, PR press releases.
7. PRIORITIZE: original reporting, hands-on analysis, official announcements, actionable tutorials.
8. Return ONLY the JSON array — no introduction, no explanation, no markdown.
`;
}

// ─── COMPANY-LEVEL GENERATION ───

export async function generateCompanyFeed(
  companyData: CompanyAnalysisCache
): Promise<{ tool_updates: FeedItem[]; company_news: CompanySection }> {
  const techStack = companyData.tech_stack
    ? Object.values(companyData.tech_stack).flat().filter(Boolean)
    : [];

  const industry = companyData.summary
    ? extractIndustryFromSummary(companyData.summary)
    : companyData.firmographics?.industry || "technology";

  const companySection: CompanySection = {
    company_name: companyData.company_name || "",
    domain: companyData.company_domain,
    summary: companyData.summary || "",
    top_technologies: techStack.slice(0, 15),
  };

  const toolUpdates = await fetchToolUpdates(techStack, industry);

  return {
    tool_updates: toolUpdates,
    company_news: companySection,
  };
}

// ─── USER-LEVEL GENERATION ───

export async function generateUserFeed(
  profile: UserProfile,
  companyData: CompanyAnalysisCache | null
): Promise<{ ai_trends: FeedItem[]; learning_skills: FeedItem[] }> {
  const techStack = companyData?.tech_stack
    ? Object.values(companyData.tech_stack).flat().filter(Boolean)
    : [];
  const aiTools = companyData?.tech_stack?.ai_ml || [];
  const industry = companyData?.summary
    ? extractIndustryFromSummary(companyData.summary)
    : companyData?.firmographics?.industry || "technology";

  const userContext = buildUserContext(profile, companyData);

  const [aiTrends, industryNews] = await Promise.all([
    fetchAiTrends(userContext),
    fetchIndustryAiNews(industry, aiTools, userContext),
  ]);

  const allTrends = [...aiTrends, ...industryNews];

  const learningItems = buildLearningRecommendations(techStack, aiTools, industry, profile);

  return {
    ai_trends: allTrends,
    learning_skills: learningItems,
  };
}

// ─── FULL FEED ASSEMBLY ───

export async function generateFeed(
  profile: UserProfile,
  companyData: CompanyAnalysisCache | null,
  cachedCompanyFeed?: { tool_updates: FeedItem[]; company_news: CompanySection } | null,
  downvotedTopics?: string[],
  collectiveContext?: string,
  upvotedTopics?: string[],
  articleCount?: number
): Promise<FeedData> {
  // Default to 8 articles, user can set 5-15
  const targetArticles = Math.min(15, Math.max(5, articleCount || 8));
  const techStack = companyData?.tech_stack
    ? Object.values(companyData.tech_stack).flat().filter(Boolean)
    : [];
  const aiTools = companyData?.tech_stack?.ai_ml || [];
  const industry = companyData?.summary
    ? extractIndustryFromSummary(companyData.summary)
    : companyData?.firmographics?.industry || "technology";

  const userContext = buildUserContext(profile, companyData);

  let toolUpdates: FeedItem[];
  let companySection: CompanySection | null;
  let aiTrends: FeedItem[];
  let industryNews: FeedItem[];

  if (cachedCompanyFeed) {
    // Use cached company data — no Claude call needed
    toolUpdates = cachedCompanyFeed.tool_updates;
    companySection = cachedCompanyFeed.company_news;

    // Only need user-level calls (2 in parallel, 25s timeout each)
    const [aiResult, indResult] = await Promise.all([
      withTimeout(fetchAiTrends(userContext, downvotedTopics, collectiveContext, upvotedTopics, Math.max(4, Math.ceil(targetArticles * 0.5))), 25000, "ai-trends").catch((e) => {
        console.error("AI trends failed:", e);
        return [] as FeedItem[];
      }),
      withTimeout(fetchIndustryAiNews(industry, aiTools, userContext, downvotedTopics, upvotedTopics, Math.max(2, Math.ceil(targetArticles * 0.2))), 25000, "industry-news").catch((e) => {
        console.error("Industry news failed:", e);
        return [] as FeedItem[];
      }),
    ]);

    aiTrends = aiResult;
    industryNews = indResult;
  } else {
    // No cache — run ALL 3 calls in PARALLEL (not sequential!) with 25s timeouts
    companySection = companyData ? {
      company_name: companyData.company_name || "",
      domain: companyData.company_domain,
      summary: companyData.summary || "",
      top_technologies: techStack.slice(0, 15),
    } : null;

    const [toolResult, aiResult, indResult] = await Promise.all([
      companyData
        ? withTimeout(fetchToolUpdates(techStack, industry, downvotedTopics, upvotedTopics, Math.max(3, Math.ceil(targetArticles * 0.3))), 25000, "tool-updates").catch((e) => {
            console.error("Tool updates failed:", e);
            return [] as FeedItem[];
          })
        : Promise.resolve([] as FeedItem[]),
      withTimeout(fetchAiTrends(userContext, downvotedTopics, collectiveContext, upvotedTopics, Math.max(4, Math.ceil(targetArticles * 0.5))), 25000, "ai-trends").catch((e) => {
        console.error("AI trends failed:", e);
        return [] as FeedItem[];
      }),
      withTimeout(fetchIndustryAiNews(industry, aiTools, userContext, downvotedTopics, upvotedTopics, Math.max(2, Math.ceil(targetArticles * 0.2))), 25000, "industry-news").catch((e) => {
        console.error("Industry news failed:", e);
        return [] as FeedItem[];
      }),
    ]);

    toolUpdates = toolResult;
    aiTrends = aiResult;
    industryNews = indResult;
  }

  const allTrends = [...aiTrends, ...industryNews];

  const seenUrls = new Set<string>();
  const deduped = (items: FeedItem[]) =>
    items.filter((item) => {
      if (!item.url || seenUrls.has(item.url)) return false;
      seenUrls.add(item.url);
      return true;
    });

  const learningItems = buildLearningRecommendations(techStack, aiTools, industry, profile);

  return {
    company_news: companySection,
    tool_updates: deduped(toolUpdates),
    ai_trends: deduped(allTrends),
    learning_skills: learningItems,
    generated_at: new Date().toISOString(),
  };
}

// ─── CLAUDE SEARCH FUNCTIONS ───

async function fetchToolUpdates(
  techStack: string[],
  industry: string,
  downvotedTopics?: string[],
  upvotedTopics?: string[],
  count: number = 3
): Promise<FeedItem[]> {
  if (techStack.length === 0) return [];

  const client = getAnthropicClient();
  const today = getTodayDate();

  // Only search top 5 tools to keep it fast
  const searchTools = techStack.slice(0, 5);
  const avoidBlock = downvotedTopics && downvotedTopics.length > 0
    ? ` Avoid topics related to: ${downvotedTopics.join(", ")}.`
    : "";
  const boostBlock = upvotedTopics && upvotedTopics.length > 0
    ? ` The user especially liked articles about: ${upvotedTopics.slice(0, 5).join("; ")}. Prioritize similar topics.`
    : "";

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
      messages: [
        {
          role: "user",
          content: `Today is ${today}. Search for recent significant news about these tools: ${searchTools.join(", ")}. PRIORITIZE breaking news from the last 48 hours. Also include major releases, breaking changes, important integrations, or security issues from the last 7 days. Only include genuinely newsworthy updates — not minor patches.${avoidBlock}${boostBlock}

Every URL MUST be a real URL you found in search results. NEVER fabricate or guess URLs.

Return ${count} articles as JSON array ONLY: [{"title":"...","summary":"one sentence on what changed + one on why it matters for ${industry}","url":"https://...","source":"...","date":"YYYY-MM-DD","category":"tool_update","relevance_note":"..."}]`,
        },
      ],
    });

    const text = extractTextFromResponse(response);
    return parseJsonFromText(text);
  } catch (error) {
    console.error("Tool updates fetch error:", error instanceof Error ? error.message : error);
    return [];
  }
}

async function fetchAiTrends(userContext: string, downvotedTopics?: string[], collectiveContext?: string, upvotedTopics?: string[], count: number = 5): Promise<FeedItem[]> {
  const client = getAnthropicClient();
  const today = getTodayDate();

  // Extract settings from context
  const interests = userContext.match(/AI interests: (.+)/)?.[1] || "AI trends";
  const role = userContext.match(/Role: (.+)/)?.[1] || "professional";
  const seniority = userContext.match(/Seniority: (.+)/)?.[1] || "";
  const level = userContext.match(/AI experience level: (.+)/)?.[1] || "intermediate";
  const goals = userContext.match(/AI goals: (.+)/)?.[1] || "";
  const company = userContext.match(/Company: (.+)/)?.[1] || "";
  const industry = userContext.match(/Industry: (.+)/)?.[1] || "technology";
  const customFocus = userContext.match(/Custom learning focus: "(.+)"/)?.[1] || "";
  const depth = userContext.match(/Content depth preference: (.+)/)?.[1] || "balanced";

  const avoidBlock = downvotedTopics && downvotedTopics.length > 0
    ? `\nAVOID these topics (user downvoted articles about them): ${downvotedTopics.join(", ")}`
    : "";

  const boostBlock = upvotedTopics && upvotedTopics.length > 0
    ? `\nPOSITIVE SIGNALS — the user upvoted articles like these:\n${upvotedTopics.slice(0, 10).map(t => `- "${t}"`).join("\n")}\nPrioritize finding MORE articles on these topics and closely related subjects.`
    : "";

  const seniorityFraming = seniority === "Executive" || seniority === "Founder" || seniority === "Director"
    ? "Focus on strategic implications, market shifts, ROI, and leadership decisions."
    : seniority === "Manager" || seniority === "Team Lead"
      ? "Focus on team adoption, workflow impact, vendor evaluation, and practical implementation."
      : "Focus on hands-on applications, tutorials, implementation patterns, and practical skills.";

  const depthFraming = depth === "high_level"
    ? "Keep summaries strategic and business-focused. Avoid deep technical details."
    : depth === "deep_technical"
      ? "Include technical details, architecture decisions, and implementation specifics."
      : "Balance business impact with enough technical detail to be actionable.";

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      messages: [
        {
          role: "user",
          content: `Today is ${today}. You are curating an AI news feed for this person:

Role: ${role} at ${company} (${industry} industry)
Seniority: ${seniority || "not specified"}
AI experience: ${level}
Interests: ${interests}
Goals: ${goals || "stay informed on AI"}
${customFocus ? `They specifically want to learn about: ${customFocus}` : ""}
${avoidBlock}
${boostBlock}

${seniorityFraming}
${depthFraming}

CRITICAL: Start by searching for BREAKING AI NEWS from the last 48 hours. Include any major announcements, model releases, leaked information, funding rounds, acquisitions, or policy changes that happened today or yesterday.

Search for ${count} total recent AI articles from the last 7 days. MIX these types:
- ${Math.ceil(count * 0.5)} articles matching their specific interests and goals (NOT just tool announcements)
- ${Math.ceil(count * 0.3)} articles about AI trends affecting their industry (${industry})
- ${Math.max(1, Math.floor(count * 0.2))} article(s) about AI strategy, adoption, or governance relevant to their role

IMPORTANT: Do NOT focus exclusively on developer tools or model releases. This person's goals include: ${goals}. Match the content to those goals.

Every URL MUST be a real URL you found in search results. NEVER fabricate or guess URLs.
${collectiveContext || ""}
Preferred sources: TechCrunch, The Verge, Ars Technica, Reuters, Axios, MIT Tech Review, a16z, McKinsey, HBR, VentureBeat, Wired, The New Stack, Simon Willison, Washington Post, The Decoder, Bloomberg, Bleeping Computer, Mashable, The Information, Semafor. But use ANY credible source.

Return ONLY a JSON array: [{"title":"...","summary":"2 sentences: what happened + why it matters for this person","url":"https://...","source":"publication name","date":"YYYY-MM-DD","category":"descriptive category","relevance_note":"1 sentence on why this was selected for them"}]`,
        },
      ],
    });

    const text = extractTextFromResponse(response);
    return parseJsonFromText(text);
  } catch (error) {
    console.error("AI trends fetch error:", error instanceof Error ? error.message : error);
    return [];
  }
}

async function fetchIndustryAiNews(
  industry: string,
  aiTools: string[],
  userContext: string,
  downvotedTopics?: string[],
  upvotedTopics?: string[],
  count: number = 3
): Promise<FeedItem[]> {
  const client = getAnthropicClient();
  const today = getTodayDate();
  const goals = userContext.match(/AI goals: (.+)/)?.[1] || "";
  const role = userContext.match(/Role: (.+)/)?.[1] || "professional";
  const avoidBlock = downvotedTopics && downvotedTopics.length > 0
    ? ` Avoid: ${downvotedTopics.join(", ")}.`
    : "";
  const boostBlock = upvotedTopics && upvotedTopics.length > 0
    ? ` The user especially liked articles about: ${upvotedTopics.slice(0, 5).join("; ")}. Find more like those.`
    : "";

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
      messages: [
        {
          role: "user",
          content: `Today is ${today}. Search for ${count} recent articles about AI adoption, strategy, or transformation in the ${industry} industry. PRIORITIZE articles from the last 48 hours. This person is a ${role} whose goals include: ${goals || "staying informed"}.${avoidBlock}${boostBlock}

Focus on business impact, case studies, and practical adoption stories — NOT just product announcements.

Every URL MUST be a real URL you found in search results. NEVER fabricate or guess URLs.

Return ONLY JSON array: [{"title":"...","summary":"2 sentences: what happened + business impact","url":"https://...","source":"...","date":"YYYY-MM-DD","category":"AI in ${industry}","relevance_note":"why this matters for their goals"}]`,
        },
      ],
    });

    const text = extractTextFromResponse(response);
    return parseJsonFromText(text);
  } catch (error) {
    console.error("Industry AI news fetch error:", error instanceof Error ? error.message : error);
    return [];
  }
}

// ─── HELPERS ───

export function extractIndustryFromSummary(summary: string): string {
  const patterns = [
    /(?:is a|is an)\s+([^.]+?)\s+company/i,
    /(?:in the|in)\s+([^.]+?)\s+(?:industry|sector|space)/i,
    /(?:specializ(?:es|ing) in)\s+([^.]+)/i,
  ];
  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match) return match[1].trim();
  }
  return "technology";
}

function buildLearningRecommendations(
  techStack: string[],
  aiTools: string[],
  industry: string,
  profile: UserProfile
): FeedItem[] {
  // Get real, role-matched courses from the training catalog
  const matchedCourses = getMatchedCourses(
    profile.role,
    profile.seniority,
    industry,
    profile.ai_interests || [],
    4 // max courses
  );

  const items: FeedItem[] = matchedCourses.map(course => ({
    title: course.title,
    summary: `${course.description}`,
    url: course.url,
    source: `${course.provider} · ${course.cost}`,
    category: "training",
    relevance_note: `Matched to your role${course.roles.length > 0 ? ` (${course.roles[0].replace("_", " ")})` : ""} and interests`,
  }));

  // Always add an industry-specific recommendation if we have few matches
  if (items.length < 3) {
    items.push({
      title: `AI for ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
      summary: `Industry-specific AI applications and case studies for the ${industry} sector. Learn how peers are deploying AI.`,
      url: "",
      category: "industry",
      relevance_note: `Tailored to your industry: ${industry}`,
    });
  }

  return items;
}
