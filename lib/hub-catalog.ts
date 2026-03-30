// Hub catalog — curated tools, prompt templates, and task workflows
// Scored and matched to user profiles, similar to training-catalog.ts

import { detectRoleCategory } from "./training-catalog";

// ── Types ──

export interface CatalogTool {
  name: string;
  description: string;
  url: string;
  icon_url?: string;
  categories: string[];
  tech_stack_tags: string[];
  interest_tags: string[];
  roles: string[];
  audience_level: string[];
}

export interface CatalogPrompt {
  title: string;
  description: string;
  content: string;
  tags: string[];
  interest_tags: string[];
  roles: string[];
}

export interface CatalogTask {
  title: string;
  description: string;
  interest_tags: string[];
  roles: string[];
  ai_goals: string[];
  linked_tool_names: string[];
  linked_prompt_titles: string[];
}

// ── Tool Catalog ──

const TOOL_CATALOG: CatalogTool[] = [
  { name: "Claude", description: "Anthropic's AI assistant — research, analysis, writing, coding. Your Swiss Army knife for knowledge work.", url: "https://claude.ai", categories: ["ai_assistant", "research", "coding"], tech_stack_tags: ["ai_ml"], interest_tags: ["LLMs & Prompting", "AI Coding Tools"], roles: ["engineering", "product_management", "marketing", "data", "executive"], audience_level: ["beginner", "intermediate", "advanced", "expert"] },
  { name: "Claude Code", description: "AI-powered coding agent that lives in your terminal. Build, debug, and refactor code with natural language.", url: "https://docs.anthropic.com/en/docs/claude-code", categories: ["ai_coding", "developer_tools"], tech_stack_tags: ["ai_ml", "backend", "frontend"], interest_tags: ["AI Coding Tools", "AI Agents & Automation"], roles: ["engineering", "data"], audience_level: ["intermediate", "advanced", "expert"] },
  { name: "Cursor", description: "AI-native code editor. Autocomplete, chat, and code generation built into your IDE.", url: "https://cursor.sh", categories: ["ai_coding", "developer_tools"], tech_stack_tags: ["backend", "frontend"], interest_tags: ["AI Coding Tools"], roles: ["engineering", "data"], audience_level: ["intermediate", "advanced", "expert"] },
  { name: "Perplexity", description: "AI-powered search engine. Get sourced answers to complex research questions with citations.", url: "https://perplexity.ai", categories: ["research", "search"], tech_stack_tags: [], interest_tags: ["LLMs & Prompting", "Data & Analytics"], roles: ["marketing", "product_management", "sales", "executive", "data"], audience_level: ["beginner", "intermediate", "advanced"] },
  { name: "NotebookLM", description: "Google's AI research assistant. Upload documents and have AI synthesize, summarize, and answer questions.", url: "https://notebooklm.google.com", categories: ["research", "knowledge_management"], tech_stack_tags: [], interest_tags: ["Data & Analytics", "LLMs & Prompting"], roles: ["product_management", "marketing", "data", "executive"], audience_level: ["beginner", "intermediate"] },
  { name: "n8n", description: "Open-source workflow automation. Connect APIs, databases, and AI models with a visual builder.", url: "https://n8n.io", categories: ["automation", "integration"], tech_stack_tags: ["devops"], interest_tags: ["AI Agents & Automation"], roles: ["engineering", "data", "marketing"], audience_level: ["intermediate", "advanced"] },
  { name: "Zapier", description: "No-code automation platform. Connect 6,000+ apps and trigger AI workflows without writing code.", url: "https://zapier.com", categories: ["automation", "integration", "no_code"], tech_stack_tags: [], interest_tags: ["AI Agents & Automation"], roles: ["marketing", "sales", "hr", "product_management"], audience_level: ["beginner", "intermediate"] },
  { name: "Supabase", description: "Open-source Firebase alternative. Postgres database, auth, storage, and realtime subscriptions.", url: "https://supabase.com", categories: ["database", "backend", "developer_tools"], tech_stack_tags: ["databases", "backend"], interest_tags: ["AI Coding Tools"], roles: ["engineering", "data"], audience_level: ["intermediate", "advanced", "expert"] },
  { name: "Apollo", description: "Sales intelligence platform. Prospect, enrich, and automate outreach with AI-powered data.", url: "https://apollo.io", categories: ["sales_intelligence", "data_enrichment"], tech_stack_tags: ["marketing_analytics"], interest_tags: ["AI for Business/GTM", "Data & Analytics"], roles: ["sales", "marketing", "executive"], audience_level: ["beginner", "intermediate"] },
  { name: "Granola AI", description: "AI meeting notes. Automatically transcribes, summarizes, and extracts action items from your calls.", url: "https://granola.ai", categories: ["meeting_notes", "productivity"], tech_stack_tags: [], interest_tags: ["AI Agents & Automation"], roles: ["product_management", "sales", "executive", "marketing"], audience_level: ["beginner", "intermediate"] },
  { name: "GPT for Sheets", description: "Run AI prompts in Google Sheets. Batch process data enrichment, classification, and generation.", url: "https://gptforwork.com", categories: ["spreadsheet_ai", "data_processing"], tech_stack_tags: [], interest_tags: ["Data & Analytics", "AI for Business/GTM"], roles: ["marketing", "data", "sales", "finance"], audience_level: ["beginner", "intermediate"] },
  { name: "Lovable", description: "AI-powered full-stack app builder. Describe what you want, get a working web app.", url: "https://lovable.dev", categories: ["ai_coding", "no_code"], tech_stack_tags: ["frontend"], interest_tags: ["AI Coding Tools"], roles: ["product_management", "marketing", "engineering"], audience_level: ["beginner", "intermediate"] },
  { name: "Playwright", description: "Microsoft's browser automation framework. End-to-end testing and web scraping with AI assistance.", url: "https://playwright.dev", categories: ["testing", "automation", "developer_tools"], tech_stack_tags: ["frontend", "devops"], interest_tags: ["AI Coding Tools"], roles: ["engineering"], audience_level: ["advanced", "expert"] },
  { name: "SerpAPI", description: "Google search results API. Programmatic access to search results for market research and data collection.", url: "https://serpapi.com", categories: ["data_collection", "api"], tech_stack_tags: [], interest_tags: ["Data & Analytics"], roles: ["engineering", "data", "marketing"], audience_level: ["intermediate", "advanced"] },
  { name: "ElevenLabs", description: "AI voice generation. Create realistic voiceovers, podcasts, and audio content from text.", url: "https://elevenlabs.io", categories: ["audio_ai", "content_creation"], tech_stack_tags: ["ai_ml"], interest_tags: ["AI for Business/GTM"], roles: ["marketing", "product_management"], audience_level: ["beginner", "intermediate"] },
  { name: "dust AI", description: "Enterprise AI assistant builder. Create custom AI workflows connected to your company's data.", url: "https://dust.tt", categories: ["ai_assistant", "enterprise"], tech_stack_tags: ["ai_ml"], interest_tags: ["AI Agents & Automation", "AI Governance & Ethics"], roles: ["engineering", "executive", "product_management"], audience_level: ["intermediate", "advanced"] },
  { name: "Microsoft Clarity", description: "Free web analytics with AI insights. Heatmaps, session recordings, and user behavior analysis.", url: "https://clarity.microsoft.com", categories: ["analytics", "ux_research"], tech_stack_tags: ["marketing_analytics"], interest_tags: ["Data & Analytics", "AI for Business/GTM"], roles: ["marketing", "product_management"], audience_level: ["beginner", "intermediate"] },
  { name: "Manus AI", description: "Autonomous AI agent for complex multi-step tasks. Research, code, and build entire projects.", url: "https://manus.im", categories: ["ai_agent", "automation"], tech_stack_tags: ["ai_ml"], interest_tags: ["AI Agents & Automation"], roles: ["engineering", "product_management", "executive"], audience_level: ["intermediate", "advanced"] },
];

// ── Prompt Catalog ──

const PROMPT_CATALOG: CatalogPrompt[] = [
  { title: "Company Research Brief", description: "Deep-dive analysis of any company — market position, competitors, tech stack, and strategic insights.", content: "Research [COMPANY NAME] and provide:\n\n1. Company Overview (what they do, size, funding stage)\n2. Core Products/Services\n3. Key Competitors (top 3-5)\n4. Technology Stack (known tools and platforms)\n5. Recent News (last 6 months)\n6. AI Adoption signals\n7. Strategic Insights (opportunities, threats)\n\nFormat as a structured brief with headers. Cite sources where possible.", tags: ["research", "strategy"], interest_tags: ["Data & Analytics", "AI for Business/GTM"], roles: ["sales", "marketing", "executive", "product_management"] },
  { title: "Data Enrichment Prompt", description: "Enrich a list of companies or contacts with structured data points using AI.", content: "I have a list of [companies/contacts]. For each entry, please extract and organize:\n\n- Company name & domain\n- Industry vertical\n- Employee count range\n- Headquarters location\n- Key decision makers (if contacts)\n- Technology stack signals\n- Recent funding/news\n\nInput data:\n[PASTE DATA HERE]\n\nReturn as a structured table.", tags: ["enrichment", "data", "automation"], interest_tags: ["Data & Analytics", "AI Agents & Automation"], roles: ["sales", "marketing", "data"] },
  { title: "Meeting Summary & Action Items", description: "Convert meeting transcripts into structured summaries with clear action items and owners.", content: "Summarize this meeting transcript:\n\n[PASTE TRANSCRIPT]\n\nProvide:\n1. **Key Decisions Made** (bullet points)\n2. **Action Items** (who, what, by when)\n3. **Open Questions** (unresolved topics)\n4. **Key Quotes** (important statements)\n5. **Next Steps** (agreed follow-ups)\n\nKeep it concise — busy executives should be able to scan this in 2 minutes.", tags: ["productivity", "meetings"], interest_tags: ["AI Agents & Automation"], roles: ["product_management", "executive", "sales", "marketing"] },
  { title: "Competitor Analysis Framework", description: "Structured competitive analysis comparing your product against key competitors.", content: "Compare [YOUR PRODUCT] against these competitors: [COMPETITOR 1], [COMPETITOR 2], [COMPETITOR 3]\n\nAnalyze across these dimensions:\n1. **Positioning** — How each positions themselves\n2. **Pricing** — Pricing models and tiers\n3. **Features** — Key feature comparison matrix\n4. **Target Audience** — Who they sell to\n5. **Strengths & Weaknesses** — For each competitor\n6. **Market Gaps** — Opportunities they're missing\n7. **Strategic Recommendations** — Where to differentiate\n\nPresent as a structured comparison.", tags: ["research", "strategy", "competitive"], interest_tags: ["AI for Business/GTM", "Data & Analytics"], roles: ["product_management", "marketing", "executive", "sales"] },
  { title: "Content Repurposing Engine", description: "Transform a long-form piece into multiple content formats for different channels.", content: "Take this content and repurpose it into:\n\n1. **LinkedIn Post** (hook + insight + CTA, under 1300 chars)\n2. **Twitter/X Thread** (5-7 tweets, conversational)\n3. **Email Newsletter Snippet** (3 paragraphs, value-first)\n4. **Blog Summary** (300 words, SEO-friendly)\n5. **Slide Deck Outline** (5-8 slides with key points)\n\nOriginal content:\n[PASTE CONTENT HERE]\n\nMaintain the core message but adapt tone for each channel.", tags: ["content", "marketing", "repurposing"], interest_tags: ["AI for Business/GTM"], roles: ["marketing", "executive"] },
  { title: "Code Review Assistant", description: "Thorough code review covering bugs, performance, security, and best practices.", content: "Review this code for:\n\n1. **Bugs & Logic Errors** — Anything that could break\n2. **Security Issues** — Injection, auth, data exposure\n3. **Performance** — N+1 queries, memory leaks, slow patterns\n4. **Best Practices** — Naming, structure, DRY, SOLID\n5. **Error Handling** — Missing try/catch, edge cases\n6. **Type Safety** — Missing types, any assertions\n\nFor each issue, explain WHY it's a problem and suggest a fix.\n\nCode:\n```\n[PASTE CODE HERE]\n```", tags: ["coding", "review", "engineering"], interest_tags: ["AI Coding Tools"], roles: ["engineering"] },
  { title: "SQL Query Builder", description: "Generate optimized SQL queries from natural language descriptions of what data you need.", content: "Generate a SQL query for the following request:\n\n[DESCRIBE WHAT DATA YOU NEED]\n\nDatabase context:\n- Tables: [LIST YOUR TABLES]\n- Key relationships: [DESCRIBE FOREIGN KEYS]\n\nRequirements:\n- Use CTEs for readability\n- Add comments explaining each section\n- Optimize for performance (indexes, avoid SELECT *)\n- Include sample results format", tags: ["coding", "data", "sql"], interest_tags: ["Data & Analytics", "AI Coding Tools"], roles: ["data", "engineering"] },
  { title: "Customer Persona Builder", description: "Create detailed buyer personas from market data, customer interviews, or product analytics.", content: "Build a detailed customer persona based on:\n\n[PASTE DATA: interview notes, analytics, survey results]\n\nInclude:\n1. **Demographics** — Role, seniority, company size, industry\n2. **Goals** — What they're trying to achieve\n3. **Pain Points** — Current frustrations\n4. **Decision Criteria** — What matters when buying\n5. **Information Sources** — Where they learn\n6. **Objections** — Common pushback\n7. **Day in the Life** — Typical workflow\n8. **Trigger Events** — What prompts them to buy\n\nGive the persona a name and make it actionable for sales and marketing.", tags: ["research", "marketing", "personas"], interest_tags: ["AI for Business/GTM", "Data & Analytics"], roles: ["marketing", "product_management", "sales"] },
  { title: "Outreach Email Draft", description: "Personalized cold outreach emails based on prospect research and mutual value.", content: "Write a personalized outreach email for:\n\n**Prospect:** [NAME, TITLE, COMPANY]\n**Context:** [What you know about them — recent news, shared connections, their company's challenges]\n**Your Value Prop:** [What you're offering and why it matters to them]\n**CTA:** [What you want them to do — meeting, demo, reply]\n\nRules:\n- Under 150 words\n- No generic flattery\n- Lead with THEIR problem, not your product\n- One clear ask\n- Sound human, not salesy", tags: ["outreach", "sales", "email"], interest_tags: ["AI for Business/GTM"], roles: ["sales", "marketing"] },
  { title: "AI Governance Checklist", description: "Evaluate AI implementation risks — bias, privacy, compliance, and organizational readiness.", content: "Evaluate this AI initiative against governance criteria:\n\n**Initiative:** [DESCRIBE THE AI PROJECT]\n\n1. **Data Privacy** — What data is used? PII exposure? GDPR/CCPA compliance?\n2. **Bias & Fairness** — Could this produce biased outcomes? How to test?\n3. **Transparency** — Can you explain how it makes decisions?\n4. **Security** — Attack vectors? Data poisoning risks?\n5. **Compliance** — Industry-specific regulations (HIPAA, SOC2, etc.)?\n6. **Human Oversight** — Where do humans review AI outputs?\n7. **Accountability** — Who owns mistakes?\n8. **Monitoring** — How to detect drift or degradation?\n\nRate each: 🟢 Low Risk | 🟡 Medium | 🔴 High Risk", tags: ["governance", "compliance", "strategy"], interest_tags: ["AI Governance & Ethics"], roles: ["executive", "legal", "engineering"] },
];

// ── Task Catalog ──

const TASK_CATALOG: CatalogTask[] = [
  { title: "Data Enrichment Pipeline", description: "Enrich leads or company data using AI + external APIs. Input raw list → output enriched database.", interest_tags: ["Data & Analytics", "AI for Business/GTM"], roles: ["sales", "marketing", "data"], ai_goals: ["Automate repetitive work", "Data pipeline automation"], linked_tool_names: ["Apollo", "GPT for Sheets", "SerpAPI"], linked_prompt_titles: ["Data Enrichment Prompt"] },
  { title: "Deck Development", description: "Create presentation decks from research and data — strategy decks, pitch decks, board updates.", interest_tags: ["AI for Business/GTM"], roles: ["marketing", "executive", "product_management", "sales"], ai_goals: ["Improve team productivity"], linked_tool_names: ["Claude", "Perplexity", "NotebookLM"], linked_prompt_titles: ["Company Research Brief", "Competitor Analysis Framework"] },
  { title: "Competitive Intelligence", description: "Monitor competitors, track market movements, and produce regular competitive reports.", interest_tags: ["AI for Business/GTM", "Data & Analytics"], roles: ["product_management", "marketing", "executive", "sales"], ai_goals: ["Stay ahead of AI trends", "Evaluate AI vendors/tools"], linked_tool_names: ["Perplexity", "SerpAPI", "Claude"], linked_prompt_titles: ["Competitor Analysis Framework", "Company Research Brief"] },
  { title: "Lead Qualification", description: "Score and qualify inbound leads using AI analysis of firmographic and behavioral data.", interest_tags: ["AI for Business/GTM", "Data & Analytics"], roles: ["sales", "marketing"], ai_goals: ["Automate repetitive work", "Improve team productivity"], linked_tool_names: ["Apollo", "GPT for Sheets", "Claude"], linked_prompt_titles: ["Customer Persona Builder", "Data Enrichment Prompt"] },
  { title: "Content Calendar", description: "Plan, create, and repurpose content across channels using AI for ideation and drafting.", interest_tags: ["AI for Business/GTM"], roles: ["marketing", "executive"], ai_goals: ["Improve team productivity", "Automate repetitive work"], linked_tool_names: ["Claude", "Perplexity", "ElevenLabs"], linked_prompt_titles: ["Content Repurposing Engine"] },
  { title: "Code Quality Audit", description: "Review codebase for bugs, security issues, performance problems, and best practice violations.", interest_tags: ["AI Coding Tools"], roles: ["engineering"], ai_goals: ["Improve team productivity", "Build AI-powered products"], linked_tool_names: ["Claude Code", "Cursor", "Playwright"], linked_prompt_titles: ["Code Review Assistant"] },
  { title: "Customer Feedback Analysis", description: "Aggregate and analyze customer feedback from multiple sources — surveys, reviews, support tickets.", interest_tags: ["Data & Analytics", "AI for Business/GTM"], roles: ["product_management", "marketing", "executive"], ai_goals: ["Data pipeline automation", "Improve team productivity"], linked_tool_names: ["Claude", "GPT for Sheets", "NotebookLM"], linked_prompt_titles: ["Customer Persona Builder"] },
  { title: "Workflow Automation Setup", description: "Design and implement automated workflows connecting your tools with AI-powered decision logic.", interest_tags: ["AI Agents & Automation"], roles: ["engineering", "data", "marketing"], ai_goals: ["Automate repetitive work", "Data pipeline automation"], linked_tool_names: ["n8n", "Zapier", "Supabase"], linked_prompt_titles: [] },
];

// ── Scoring & Matching ──

interface TechStack {
  [category: string]: string[];
}

export interface FeedbackSignals {
  upvotedSources: string[];    // source names from thumbs-up articles
  upvotedCategories: string[]; // categories from thumbs-up articles
  upvotedKeywords: string[];   // keywords extracted from upvoted article titles
}

export function getMatchedHubItems(
  role: string | null,
  seniority: string | null,
  aiInterests: string[],
  aiGoals: string[],
  techStack: TechStack | null,
  maxPerType: number = 6,
  feedbackSignals?: FeedbackSignals
): { tools: CatalogTool[]; prompts: CatalogPrompt[]; tasks: CatalogTask[] } {
  const roleCategories = detectRoleCategory(role, seniority);
  const flatTech = techStack
    ? Object.values(techStack).flat().map((t) => t.toLowerCase())
    : [];
  const upSources = (feedbackSignals?.upvotedSources || []).map((s) => s.toLowerCase());
  const upCategories = (feedbackSignals?.upvotedCategories || []).map((c) => c.toLowerCase());
  const upKeywords = (feedbackSignals?.upvotedKeywords || []).map((k) => k.toLowerCase());

  // Score tools
  const scoredTools = TOOL_CATALOG.map((tool) => {
    let score = 0;
    if (tool.roles.some((r) => roleCategories.includes(r))) score += 10;
    if (flatTech.some((t) => t.toLowerCase().includes(tool.name.toLowerCase()))) score += 8;
    if (tool.interest_tags.some((t) => aiInterests.includes(t))) score += 5;
    if (tool.audience_level.includes((seniority || "intermediate").toLowerCase())) score += 2;
    // Feedback boost: tool name mentioned in upvoted article sources or keywords
    if (upSources.some((s) => s.includes(tool.name.toLowerCase()))) score += 6;
    if (upKeywords.some((k) => k.includes(tool.name.toLowerCase()) || tool.name.toLowerCase().includes(k))) score += 4;
    // Category overlap: tool categories match upvoted article categories
    if (tool.categories.some((c) => upCategories.includes(c))) score += 3;
    return { item: tool, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPerType)
    .map((s) => s.item);

  // Score prompts
  const scoredPrompts = PROMPT_CATALOG.map((prompt) => {
    let score = 0;
    if (prompt.roles.some((r) => roleCategories.includes(r))) score += 10;
    if (prompt.interest_tags.some((t) => aiInterests.includes(t))) score += 5;
    // Feedback boost: prompt tags match upvoted categories
    if (prompt.tags.some((t) => upCategories.includes(t.toLowerCase()))) score += 4;
    if (upKeywords.some((k) => prompt.title.toLowerCase().includes(k))) score += 3;
    return { item: prompt, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPerType)
    .map((s) => s.item);

  // Score tasks
  const scoredTasks = TASK_CATALOG.map((task) => {
    let score = 0;
    if (task.roles.some((r) => roleCategories.includes(r))) score += 10;
    if (task.interest_tags.some((t) => aiInterests.includes(t))) score += 5;
    if (task.ai_goals.some((g) => aiGoals.includes(g))) score += 4;
    // Feedback boost: task linked tools match upvoted keywords
    if (task.linked_tool_names.some((t) => upKeywords.some((k) => t.toLowerCase().includes(k)))) score += 4;
    if (upCategories.some((c) => task.title.toLowerCase().includes(c))) score += 3;
    return { item: task, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPerType)
    .map((s) => s.item);

  return { tools: scoredTools, prompts: scoredPrompts, tasks: scoredTasks };
}
