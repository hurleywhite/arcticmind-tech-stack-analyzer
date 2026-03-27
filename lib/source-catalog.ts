// ArcticPulse Source Catalog — curated sources for AI news feed generation
// These sources are PREFERRED but not exclusive. Claude should also surface
// content from any reputable source found via web search.

export interface Source {
  name: string;
  url: string;
  category: string;
  source_type: string;
  audience_level: string[];
  topic_tags: string[];
  content_type: string;
  frequency: string;
  notes?: string;
  industry?: string;
}

export const SOURCE_CATALOG: Source[] = [
  // ─── AI LAB BLOGS ───
  { name: "Anthropic Research Blog", url: "https://www.anthropic.com/research", category: "research", source_type: "ai_lab", audience_level: ["advanced", "expert"], topic_tags: ["LLMs & Prompting", "AI Governance & Ethics"], content_type: "research_papers_and_announcements", frequency: "weekly", notes: "Primary source for Claude model updates, safety research" },
  { name: "Anthropic News", url: "https://www.anthropic.com/news", category: "product_updates", source_type: "ai_lab", audience_level: ["beginner", "intermediate", "advanced"], topic_tags: ["AI Coding Tools", "AI Agents & Automation", "LLMs & Prompting"], content_type: "product_announcements", frequency: "weekly" },
  { name: "OpenAI Research", url: "https://openai.com/research", category: "research", source_type: "ai_lab", audience_level: ["advanced", "expert"], topic_tags: ["LLMs & Prompting", "Computer Vision", "AI Agents & Automation"], content_type: "research_papers", frequency: "weekly" },
  { name: "OpenAI News", url: "https://openai.com/news/product-releases/", category: "product_updates", source_type: "ai_lab", audience_level: ["beginner", "intermediate", "advanced"], topic_tags: ["LLMs & Prompting", "AI Coding Tools", "AI Agents & Automation"], content_type: "product_announcements", frequency: "multiple_per_week" },
  { name: "Google DeepMind Blog", url: "https://deepmind.google/blog/", category: "product_updates", source_type: "ai_lab", audience_level: ["intermediate", "advanced"], topic_tags: ["LLMs & Prompting", "Computer Vision"], content_type: "announcements_and_explainers", frequency: "weekly" },
  { name: "Meta AI Research", url: "https://ai.meta.com/research/", category: "research", source_type: "ai_lab", audience_level: ["advanced", "expert"], topic_tags: ["LLMs & Prompting", "Computer Vision"], content_type: "research_papers", frequency: "weekly", notes: "Llama model updates, open-source AI" },
  { name: "Microsoft Research Blog", url: "https://www.microsoft.com/en-us/research/blog/", category: "research", source_type: "ai_lab", audience_level: ["intermediate", "advanced"], topic_tags: ["AI Coding Tools", "AI Agents & Automation", "Data & Analytics"], content_type: "research_summaries", frequency: "multiple_per_week" },
  { name: "Mistral AI Blog", url: "https://mistral.ai/news/", category: "product_updates", source_type: "ai_lab", audience_level: ["intermediate", "advanced"], topic_tags: ["LLMs & Prompting"], content_type: "product_announcements", frequency: "biweekly" },

  // ─── DEVELOPER PLATFORMS ───
  { name: "GitHub Blog", url: "https://github.blog/", category: "product_updates", source_type: "platform", audience_level: ["intermediate", "advanced"], topic_tags: ["AI Coding Tools", "AI Agents & Automation"], content_type: "product_updates_and_engineering", frequency: "multiple_per_week", notes: "Copilot updates, GitHub Actions" },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog", category: "product_updates", source_type: "platform", audience_level: ["intermediate", "advanced", "expert"], topic_tags: ["LLMs & Prompting", "AI Coding Tools"], content_type: "model_releases_and_tutorials", frequency: "multiple_per_week" },
  { name: "LangChain Blog", url: "https://blog.langchain.dev/", category: "product_updates", source_type: "platform", audience_level: ["intermediate", "advanced"], topic_tags: ["AI Agents & Automation", "AI Coding Tools", "LLMs & Prompting"], content_type: "tutorials_and_releases", frequency: "weekly" },
  { name: "Vercel Blog", url: "https://vercel.com/blog", category: "product_updates", source_type: "developer_tool", audience_level: ["intermediate", "advanced"], topic_tags: ["AI Coding Tools"], content_type: "product_and_engineering", frequency: "weekly" },
  { name: "Cursor Blog", url: "https://www.cursor.com/blog", category: "product_updates", source_type: "developer_tool", audience_level: ["intermediate", "advanced"], topic_tags: ["AI Coding Tools"], content_type: "product_updates", frequency: "biweekly" },

  // ─── CLOUD VENDORS ───
  { name: "AWS AI Blog", url: "https://aws.amazon.com/blogs/machine-learning/", category: "product_updates", source_type: "cloud_vendor", audience_level: ["intermediate", "advanced"], topic_tags: ["Data & Analytics", "AI Agents & Automation"], content_type: "product_launches_and_tutorials", frequency: "multiple_per_week" },
  { name: "Azure AI Blog", url: "https://azure.microsoft.com/en-us/blog/product/azure-ai/", category: "product_updates", source_type: "cloud_vendor", audience_level: ["intermediate", "advanced"], topic_tags: ["Data & Analytics", "AI Agents & Automation"], content_type: "product_launches", frequency: "weekly" },
  { name: "Google Cloud AI Blog", url: "https://cloud.google.com/blog/products/ai-machine-learning", category: "product_updates", source_type: "cloud_vendor", audience_level: ["intermediate", "advanced"], topic_tags: ["Data & Analytics", "AI Agents & Automation"], content_type: "product_launches_and_case_studies", frequency: "weekly" },
  { name: "Snowflake Blog", url: "https://www.snowflake.com/blog/", category: "product_updates", source_type: "cloud_vendor", audience_level: ["intermediate", "advanced"], topic_tags: ["Data & Analytics"], content_type: "product_updates", frequency: "multiple_per_week" },
  { name: "Databricks Blog", url: "https://www.databricks.com/blog", category: "product_updates", source_type: "cloud_vendor", audience_level: ["intermediate", "advanced"], topic_tags: ["Data & Analytics", "LLMs & Prompting"], content_type: "product_and_engineering", frequency: "multiple_per_week" },

  // ─── TECH MEDIA ───
  { name: "The Verge - AI", url: "https://www.theverge.com/ai-artificial-intelligence", category: "news", source_type: "tech_media", audience_level: ["beginner", "intermediate"], topic_tags: ["LLMs & Prompting", "AI Governance & Ethics", "AI for Business/GTM"], content_type: "news_and_analysis", frequency: "daily", notes: "Accessible AI coverage" },
  { name: "TechCrunch - AI", url: "https://techcrunch.com/category/artificial-intelligence/", category: "news", source_type: "tech_media", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM", "AI Agents & Automation"], content_type: "startup_and_funding_news", frequency: "daily" },
  { name: "Ars Technica - AI", url: "https://arstechnica.com/ai/", category: "news", source_type: "tech_media", audience_level: ["intermediate", "advanced"], topic_tags: ["LLMs & Prompting", "AI Governance & Ethics"], content_type: "in_depth_analysis", frequency: "daily" },
  { name: "The New Stack", url: "https://thenewstack.io/", category: "news", source_type: "tech_media", audience_level: ["intermediate", "advanced"], topic_tags: ["AI Coding Tools", "AI Agents & Automation", "Data & Analytics"], content_type: "developer_focused_analysis", frequency: "daily" },
  { name: "VentureBeat - AI", url: "https://venturebeat.com/category/ai/", category: "news", source_type: "tech_media", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM", "AI Agents & Automation"], content_type: "enterprise_ai_news", frequency: "daily" },
  { name: "MIT Technology Review - AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/", category: "news", source_type: "tech_media", audience_level: ["intermediate", "advanced"], topic_tags: ["AI Governance & Ethics", "LLMs & Prompting"], content_type: "analysis_and_features", frequency: "multiple_per_week" },

  // ─── BUSINESS MEDIA ───
  { name: "CNBC - AI", url: "https://www.cnbc.com/artificial-intelligence/", category: "news", source_type: "business_media", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM"], content_type: "business_and_market_analysis", frequency: "daily" },
  { name: "Reuters Technology", url: "https://www.reuters.com/technology/", category: "news", source_type: "business_media", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM", "AI Governance & Ethics"], content_type: "wire_service_news", frequency: "daily" },

  // ─── INDEPENDENT ANALYSIS ───
  { name: "Simon Willison's Weblog", url: "https://simonwillison.net/", category: "analysis", source_type: "independent", audience_level: ["intermediate", "advanced"], topic_tags: ["LLMs & Prompting", "AI Coding Tools", "AI Agents & Automation"], content_type: "hands_on_analysis_and_tutorials", frequency: "daily", notes: "Extremely high signal-to-noise" },
  { name: "a16z AI Blog", url: "https://a16z.com/ai/", category: "analysis", source_type: "independent", audience_level: ["intermediate", "advanced"], topic_tags: ["AI for Business/GTM", "AI Agents & Automation"], content_type: "market_analysis_and_frameworks", frequency: "weekly" },

  // ─── NEWSLETTERS ───
  { name: "TLDR AI", url: "https://tldr.tech/ai", category: "newsletter", source_type: "newsletter", audience_level: ["beginner", "intermediate"], topic_tags: ["LLMs & Prompting", "AI Coding Tools", "AI Agents & Automation"], content_type: "curated_daily_digest", frequency: "daily" },
  { name: "The Batch (Andrew Ng)", url: "https://www.deeplearning.ai/the-batch/", category: "newsletter", source_type: "newsletter", audience_level: ["intermediate", "advanced"], topic_tags: ["LLMs & Prompting", "AI Governance & Ethics", "Data & Analytics"], content_type: "curated_weekly_analysis", frequency: "weekly" },
  { name: "AlphaSignal", url: "https://alphasignal.ai/", category: "newsletter", source_type: "newsletter", audience_level: ["advanced", "expert"], topic_tags: ["LLMs & Prompting", "AI Coding Tools"], content_type: "technical_digest", frequency: "weekly" },

  // ─── ADDITIONAL NEWS / MEDIA ───
  { name: "Washington Post - Technology", url: "https://www.washingtonpost.com/technology/", category: "news", source_type: "business_media", audience_level: ["beginner", "intermediate"], topic_tags: ["AI Governance & Ethics", "AI for Business/GTM", "LLMs & Prompting"], content_type: "investigative_and_analysis", frequency: "daily", notes: "Strong investigative AI reporting, policy coverage" },
  { name: "The Decoder", url: "https://the-decoder.com/", category: "news", source_type: "tech_media", audience_level: ["intermediate", "advanced"], topic_tags: ["LLMs & Prompting", "AI Agents & Automation", "Computer Vision"], content_type: "ai_focused_news", frequency: "daily", notes: "Dedicated AI news site — model releases, benchmarks, product launches" },
  { name: "Bleeping Computer", url: "https://www.bleepingcomputer.com/", category: "news", source_type: "tech_media", audience_level: ["intermediate", "advanced"], topic_tags: ["AI Governance & Ethics", "AI Coding Tools"], content_type: "security_and_tech_news", frequency: "daily", notes: "AI security risks, vulnerabilities, cybersecurity + AI intersection" },
  { name: "GlobeNewswire", url: "https://www.globenewswire.com/", category: "news", source_type: "wire_service", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM"], content_type: "press_releases_and_announcements", frequency: "realtime", notes: "Official company announcements, funding rounds, partnerships" },
  { name: "Bloomberg Technology", url: "https://www.bloomberg.com/technology", category: "news", source_type: "business_media", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM"], content_type: "market_and_business_analysis", frequency: "daily", notes: "Market analysis, enterprise AI, funding" },

  // ─── ENTERPRISE / ANALYST ───
  { name: "McKinsey AI Insights", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights", category: "enterprise_adoption", source_type: "analyst", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM", "AI Governance & Ethics"], content_type: "enterprise_research_and_frameworks", frequency: "monthly" },
  { name: "Harvard Business Review - AI", url: "https://hbr.org/topic/subject/ai-and-machine-learning", category: "enterprise_adoption", source_type: "analyst", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM", "AI Governance & Ethics"], content_type: "business_strategy", frequency: "weekly" },
  { name: "Deloitte AI Insights", url: "https://www.deloitte.com/global/en/issues/artificial-intelligence.html", category: "enterprise_adoption", source_type: "analyst", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM", "AI Governance & Ethics"], content_type: "enterprise_research_and_frameworks", frequency: "monthly", notes: "Enterprise AI adoption frameworks, industry benchmarks, C-suite perspectives" },

  // ─── AUTOMATION TOOLS ───
  { name: "n8n Blog", url: "https://n8n.io/blog/", category: "product_updates", source_type: "automation_tool", audience_level: ["beginner", "intermediate", "advanced"], topic_tags: ["AI Agents & Automation"], content_type: "tutorials_and_updates", frequency: "weekly" },
  { name: "Zapier Blog", url: "https://zapier.com/blog/", category: "product_updates", source_type: "automation_tool", audience_level: ["beginner", "intermediate"], topic_tags: ["AI Agents & Automation", "AI for Business/GTM"], content_type: "tutorials_and_tool_reviews", frequency: "multiple_per_week" },

  // ─── NEWS / BUSINESS MEDIA (continued) ───
  { name: "Axios Technology", url: "https://www.axios.com/technology", category: "news", source_type: "tech_media", audience_level: ["beginner", "intermediate", "advanced"], topic_tags: ["AI for Business/GTM", "AI Agents & Automation", "AI Governance & Ethics", "LLMs & Prompting"], content_type: "concise_news_and_analysis", frequency: "daily", notes: "Smart brevity format — concise, high-signal tech and AI coverage. Good for busy professionals" },

  // ─── COMMUNITY ───
  { name: "Hacker News", url: "https://news.ycombinator.com/", category: "community", source_type: "forum", audience_level: ["intermediate", "advanced", "expert"], topic_tags: ["AI Coding Tools", "LLMs & Prompting", "AI Agents & Automation"], content_type: "community_curated_links_and_discussion", frequency: "realtime" },

  // ─── ACADEMIC & RESEARCH ───
  { name: "ArXiv cs.AI", url: "https://arxiv.org/list/cs.AI/recent", category: "research", source_type: "academic", audience_level: ["expert"], topic_tags: ["LLMs & Prompting", "Computer Vision"], content_type: "preprints", frequency: "daily", notes: "Only for Expert-level users" },
  { name: "Papers With Code", url: "https://paperswithcode.com/", category: "research", source_type: "academic", audience_level: ["advanced", "expert"], topic_tags: ["LLMs & Prompting", "Computer Vision", "Data & Analytics"], content_type: "research_with_implementations", frequency: "daily" },
  { name: "Google Research Blog", url: "https://research.google/blog/", category: "research", source_type: "ai_lab", audience_level: ["intermediate", "advanced", "expert"], topic_tags: ["LLMs & Prompting", "Data & Analytics", "Computer Vision"], content_type: "research_summaries", frequency: "multiple_per_week", notes: "Groundbreaking research like TurboQuant, efficiency breakthroughs" },

  // ─── INDUSTRY-SPECIFIC ───
  { name: "dwealth.news", url: "https://dwealth.news/", category: "industry_specific", source_type: "industry_media", audience_level: ["intermediate", "advanced"], topic_tags: ["Data & Analytics", "AI for Business/GTM"], content_type: "finance_ai_roundup", frequency: "weekly", notes: "Weekly AI finance news roundup" },
  { name: "STAT News - AI in Healthcare", url: "https://www.statnews.com/category/artificial-intelligence/", category: "industry_specific", source_type: "industry_media", audience_level: ["beginner", "intermediate", "advanced"], topic_tags: ["AI Governance & Ethics"], content_type: "healthcare_ai_news", frequency: "daily" },

  // ─── ADDITIONAL NEWS SOURCES ───
  { name: "Axios Technology", url: "https://www.axios.com/technology", category: "news", source_type: "tech_media", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM", "AI Governance & Ethics"], content_type: "concise_news", frequency: "daily", notes: "Smart brevity format — concise, high-signal tech news" },
  { name: "Washington Post Technology", url: "https://www.washingtonpost.com/technology/", category: "news", source_type: "business_media", audience_level: ["beginner", "intermediate"], topic_tags: ["AI Governance & Ethics", "AI for Business/GTM"], content_type: "news_and_policy", frequency: "daily" },
  { name: "The Decoder", url: "https://the-decoder.com/", category: "news", source_type: "tech_media", audience_level: ["intermediate", "advanced"], topic_tags: ["LLMs & Prompting", "AI Agents & Automation", "Computer Vision"], content_type: "ai_focused_news", frequency: "daily", notes: "Dedicated AI news — model releases, benchmarks, tools" },
  { name: "Deloitte AI Insights", url: "https://www2.deloitte.com/us/en/pages/consulting/topics/ai-insights.html", category: "enterprise_adoption", source_type: "analyst", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM", "AI Governance & Ethics"], content_type: "enterprise_research", frequency: "monthly" },
  { name: "Bleeping Computer", url: "https://www.bleepingcomputer.com/", category: "news", source_type: "tech_media", audience_level: ["intermediate", "advanced"], topic_tags: ["AI Governance & Ethics"], content_type: "security_news", frequency: "daily", notes: "AI security threats, vulnerabilities, cyber defense" },
  { name: "GlobeNewswire", url: "https://www.globenewswire.com/", category: "news", source_type: "wire_service", audience_level: ["beginner", "intermediate"], topic_tags: ["AI for Business/GTM"], content_type: "press_releases", frequency: "realtime", notes: "Official company announcements, partnerships, funding" },
];

// ─── HELPER FUNCTIONS ───

export function getSourcesForLevel(level: string): Source[] {
  return SOURCE_CATALOG.filter(s => s.audience_level.includes(level.toLowerCase()));
}

export function getSourcesForTopics(topics: string[]): Source[] {
  return SOURCE_CATALOG.filter(s =>
    s.topic_tags.some(tag => topics.includes(tag))
  );
}

export function getPreferredSourceNames(level: string, topics: string[]): string[] {
  const levelSources = getSourcesForLevel(level);
  const topicSources = getSourcesForTopics(topics);
  const combined = new Set([...levelSources, ...topicSources].map(s => s.name));
  return Array.from(combined).slice(0, 20); // Top 20 most relevant
}

export function getSourceGuidance(level: string): string {
  switch (level.toLowerCase()) {
    case "beginner":
      return "PREFER accessible sources: The Verge, TechCrunch, TLDR AI, The Rundown AI, Superhuman AI, Salesforce Blog, McKinsey, HBR, CNBC, Zapier Blog. AVOID raw research papers and highly technical content.";
    case "intermediate":
      return "MIX of accessible and deeper sources: The Verge, TechCrunch, Ars Technica, MIT Tech Review, vendor blogs, The Batch, a16z, The New Stack. Include some technical content but explain jargon.";
    case "advanced":
      return "Include deeper analysis: Simon Willison, The New Stack, Ars Technica, a16z, vendor engineering blogs, Hugging Face, LangChain, Hacker News. Technical content is welcome.";
    case "expert":
      return "Include research-level content: ArXiv papers, Papers With Code, r/LocalLLaMA, AlphaSignal, The Gradient, lab research blogs, Hacker News. Raw technical depth is expected.";
    default:
      return "MIX of accessible and technical sources. Prioritize actionable content.";
  }
}

export function getDepthGuidance(depth: string): string {
  switch (depth.toLowerCase()) {
    case "high-level":
      return "Focus on STRATEGIC implications and business impact. Avoid implementation details. Sources: McKinsey, HBR, Bloomberg, CNBC, a16z, Sequoia, Forrester, Gartner, Reuters.";
    case "balanced":
      return "Mix strategic overview with practical details. Sources: The Verge, TechCrunch, Ars Technica, MIT Tech Review, The Batch, vendor blogs.";
    case "deep-technical":
      return "Prioritize implementation details, code examples, benchmarks, architecture decisions. Sources: Simon Willison, The New Stack, Hugging Face, LangChain, GitHub, vendor changelogs, Hacker News, Papers With Code.";
    default:
      return "Balanced mix of strategic and practical content.";
  }
}

export function getVendorBlogForTool(toolName: string): string | null {
  const vendorMap: Record<string, string> = {
    "snowflake": "https://www.snowflake.com/blog/",
    "databricks": "https://www.databricks.com/blog",
    "langchain": "https://blog.langchain.dev/",
    "github copilot": "https://github.blog/",
    "copilot": "https://github.blog/",
    "vercel": "https://vercel.com/blog",
    "next.js": "https://vercel.com/blog",
    "nextjs": "https://vercel.com/blog",
    "cursor": "https://www.cursor.com/blog",
    "aws": "https://aws.amazon.com/blogs/machine-learning/",
    "azure": "https://azure.microsoft.com/en-us/blog/product/azure-ai/",
    "google cloud": "https://cloud.google.com/blog/products/ai-machine-learning",
    "hugging face": "https://huggingface.co/blog",
    "openai": "https://openai.com/news/product-releases/",
    "claude": "https://www.anthropic.com/news",
    "anthropic": "https://www.anthropic.com/news",
    "n8n": "https://n8n.io/blog/",
    "zapier": "https://zapier.com/blog/",
    "notion": "https://www.notion.com/blog",
    "slack": "https://slack.com/blog",
    "dbt": "https://www.getdbt.com/blog",
    "supabase": "https://supabase.com/blog",
    "postgresql": "https://www.postgresql.org/about/news/",
    "python": "https://blog.python.org/",
    "react": "https://react.dev/blog",
    "typescript": "https://devblogs.microsoft.com/typescript/",
    "tensorflow": "https://blog.tensorflow.org/",
    "pytorch": "https://pytorch.org/blog/",
    "mistral": "https://mistral.ai/news/",
  };

  const lower = toolName.toLowerCase();
  for (const [key, url] of Object.entries(vendorMap)) {
    if (lower.includes(key)) return url;
  }
  return null;
}
