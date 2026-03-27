// Training catalog — role-matched AI courses for the Learning & Skills section
// These are real, free/freemium courses curated for ArcticPulse users

export interface TrainingCourse {
  title: string;
  provider: string;
  url: string;
  cost: string; // "Free", "Free + Certificate", "Free to audit"
  description: string;
  duration?: string;
  roles: string[]; // Which roles this matches
  industries?: string[]; // Which industries this matches (optional)
  seniority?: string[]; // Which seniority levels (optional)
  tags: string[]; // AI interest tags
}

// Role keywords → category mapping
const ROLE_CATEGORIES: Record<string, string[]> = {
  // Order matters — more specific categories checked FIRST
  data: ["data ops", "data operations", "data engineer", "data scientist", "data analyst", "data", "analytics", "bi ", "business intelligence", "data science", "ml engineer", "machine learning", "ai engineer"],
  engineering: ["software engineer", "developer", "programmer", "devops", "sre", "backend", "frontend", "full stack", "architect", "engineer"],
  product_management: ["product manager", "product owner", "product lead", "product director", "product vp"],
  marketing: ["marketing manager", "marketing director", "content strategist", "brand manager", "growth", "demand gen", "social media manager", "seo specialist", "marketing"],
  sales: ["sales manager", "sales director", "business development", "bdr", "sdr", "account executive", "revenue", "partnerships", "sales"],
  finance: ["finance", "accounting", "cfo", "controller", "financial analyst", "treasury", "audit", "cpa", "bookkeeper"],
  legal: ["legal", "lawyer", "attorney", "counsel", "compliance officer", "paralegal", "law"],
  healthcare: ["healthcare", "medical", "clinical", "nurse", "physician", "pharma", "biotech", "health"],
  supply_chain: ["supply chain", "logistics manager", "logistics director", "procurement", "warehouse", "inventory", "freight"],
  cybersecurity: ["cybersecurity", "security engineer", "security analyst", "infosec", "soc analyst", "penetration tester", "threat"],
  hr: ["hr manager", "hr director", "human resources", "people ops", "talent acquisition", "recruiting", "recruiter", "l&d", "learning and development"],
  executive: ["ceo", "cto", "coo", "cfo", "founder", "co-founder", "chief", "managing director", "partner", "principal"],
};

export function detectRoleCategory(role: string | null, seniority: string | null): string[] {
  const categories: string[] = [];
  const roleLower = (role || "").toLowerCase();
  const seniorityLower = (seniority || "").toLowerCase();

  // Check multi-word keywords first (more specific), then single-word
  // Sort keywords by length descending so "data operations" matches before "data"
  for (const [category, keywords] of Object.entries(ROLE_CATEGORIES)) {
    const sortedKw = [...keywords].sort((a, b) => b.length - a.length);
    if (sortedKw.some(kw => roleLower.includes(kw))) {
      categories.push(category);
      // Stop after first strong match (2+ word keyword) to prevent over-matching
      if (sortedKw.find(kw => kw.includes(" ") && roleLower.includes(kw))) {
        break;
      }
    }
  }

  // If we got too many categories, keep only the top 2
  if (categories.length > 2) {
    categories.length = 2;
  }

  // Seniority-based additions
  if (["executive", "founder", "director", "vp"].includes(seniorityLower)) {
    if (!categories.includes("executive")) categories.push("executive");
  }

  // Default to general business if nothing matched
  if (categories.length === 0) categories.push("executive");

  return categories;
}

export function detectIndustryCategory(industry: string): string[] {
  const lower = industry.toLowerCase();
  const categories: string[] = [];

  if (/health|medical|pharma|biotech|clinical|hospital/.test(lower)) categories.push("healthcare");
  if (/financ|bank|insurance|invest|accounting|fintech/.test(lower)) categories.push("finance");
  if (/legal|law/.test(lower)) categories.push("legal");
  if (/supply|logistics|manufactur|warehouse|freight/.test(lower)) categories.push("supply_chain");
  if (/cyber|security|infosec/.test(lower)) categories.push("cybersecurity");
  if (/market|advertis|media|content/.test(lower)) categories.push("marketing");
  if (/retail|ecommerce|commerce/.test(lower)) categories.push("sales");
  if (/education|school|university|training/.test(lower)) categories.push("executive"); // general

  return categories;
}

const TRAINING_COURSES: TrainingCourse[] = [
  // ── Product Management ──
  {
    title: "AI for Product Managers",
    provider: "Alison",
    url: "https://alison.com/course/ai-for-product-managers",
    cost: "Free + Certificate",
    description: "Covers ML, NLP, and AI integration challenges specifically for product managers.",
    roles: ["product_management"],
    tags: ["AI Agents & Automation", "LLMs & Prompting"],
  },
  {
    title: "Generative AI for Product Managers",
    provider: "IBM SkillsBuild",
    url: "https://skillsbuild.org/learn/course/generative-ai-for-product-managers",
    cost: "Free",
    description: "AI use cases, roadmapping, and PM workflows with generative AI tools.",
    roles: ["product_management"],
    tags: ["AI Agents & Automation"],
  },
  {
    title: "AI PM Course",
    provider: "FreeAIPMCourse.com",
    url: "https://freeaipmcourse.com/",
    cost: "Free + Certificate",
    description: "Most comprehensive free AI PM curriculum — covers synthetic personas, agentic workflows, and AI-powered product discovery.",
    roles: ["product_management"],
    tags: ["AI Agents & Automation", "LLMs & Prompting"],
  },

  // ── Marketing ──
  {
    title: "AI for Marketing",
    provider: "HubSpot Academy",
    url: "https://academy.hubspot.com/courses/ai-for-marketers",
    cost: "Free + Certificate",
    description: "6-hour course on AI content creation, personalization, and marketing tool evaluation. Best starting point for marketers.",
    duration: "6 hours",
    roles: ["marketing"],
    tags: ["AI for Business/GTM", "AI Agents & Automation"],
  },
  {
    title: "AI for Marketers",
    provider: "Salesforce Trailhead",
    url: "https://trailhead.salesforce.com/content/learn/trails/get-started-with-ai-for-marketing",
    cost: "Free",
    description: "Generative AI for campaigns, AI agents for customer interactions, and marketing automation.",
    roles: ["marketing"],
    tags: ["AI for Business/GTM", "AI Agents & Automation"],
  },
  {
    title: "AI in Marketing",
    provider: "Semrush Academy",
    url: "https://www.semrush.com/academy/",
    cost: "Free + Certificate",
    description: "AI applications for SEO, content marketing, and digital campaign optimization.",
    roles: ["marketing"],
    tags: ["AI for Business/GTM"],
  },
  {
    title: "AI Fluency (Anthropic Academy)",
    provider: "Anthropic",
    url: "https://anthropic.skilljar.com/",
    cost: "Free + Certificate",
    description: "4D framework for thinking with AI — excellent for content strategists and marketing professionals.",
    roles: ["marketing", "executive"],
    tags: ["LLMs & Prompting", "AI for Business/GTM"],
  },

  // ── Sales ──
  {
    title: "AI Sales Training / Agentforce",
    provider: "Salesforce Trailhead",
    url: "https://trailhead.salesforce.com/content/learn/trails/get-started-with-agentforce",
    cost: "Free",
    description: "SDR automation, Sales Coach agent, and AI-powered prospecting with Agentforce.",
    roles: ["sales"],
    tags: ["AI Agents & Automation", "AI for Business/GTM"],
  },
  {
    title: "AI in Sales & Marketing",
    provider: "Oxford Home Study Centre",
    url: "https://www.oxfordhomestudy.com/courses/ai-courses-online/artificial-intelligence-in-sales-and-marketing",
    cost: "Free + Certificate",
    description: "Practical AI for sales forecasting, customer targeting, and lead generation.",
    roles: ["sales", "marketing"],
    tags: ["AI for Business/GTM"],
  },

  // ── Finance & Accounting ──
  {
    title: "AI for Finance & Accounting",
    provider: "FreeAcademy.ai",
    url: "https://freeacademy.ai/",
    cost: "Free + Certificate",
    description: "Built for CPAs, analysts, and CFOs — covers fraud detection, automated reconciliation, and AI forecasting.",
    roles: ["finance"],
    tags: ["Data & Analytics", "AI Agents & Automation"],
  },
  {
    title: "AI Applications in Accounting and Finance",
    provider: "University of Maryland / Coursera",
    url: "https://www.coursera.org/learn/ai-accounting-finance",
    cost: "Free to audit",
    description: "Working with unstructured financial data and AI-powered analysis workflows.",
    roles: ["finance"],
    tags: ["Data & Analytics"],
  },

  // ── Legal ──
  {
    title: "Legal AI Fundamentals Certification",
    provider: "Clio",
    url: "https://www.clio.com/resources/ai-for-lawyers/legal-ai-fundamentals-certification/",
    cost: "Free + Certificate",
    description: "Built for law firms — covers AI tool selection, ethics, confidentiality, and task automation.",
    roles: ["legal"],
    tags: ["AI Governance & Ethics", "AI Agents & Automation"],
  },
  {
    title: "AI Law & Legal Training",
    provider: "The Open University / UKRI",
    url: "https://www.open.edu/openlearncreate/course/index.php?categoryid=2150",
    cost: "Free",
    description: "8-course series on AI use cases, risk, regulation, and ethics for legal professionals.",
    roles: ["legal"],
    tags: ["AI Governance & Ethics"],
  },

  // ── Healthcare ──
  {
    title: "Generative AI for Healthcare",
    provider: "Google / DiMe Society",
    url: "https://dimesociety.org/courses/generative-ai-for-healthcare/",
    cost: "Free",
    description: "LLMs in clinical and administrative healthcare settings — for clinicians, admins, and researchers.",
    roles: ["healthcare"],
    industries: ["healthcare_pharma"],
    tags: ["LLMs & Prompting"],
  },
  {
    title: "AI in Healthcare",
    provider: "RCSI + Microsoft",
    url: "https://www.rcsi.com/dublin/about/faculty-of-medicine-and-health-sciences/ai-in-healthcare",
    cost: "Free",
    description: "AI ethics, governance, and patient care applications for all healthcare workers.",
    roles: ["healthcare"],
    industries: ["healthcare_pharma"],
    tags: ["AI Governance & Ethics"],
  },

  // ── Supply Chain & Operations ──
  {
    title: "Unlocking AI in Logistics & Supply Chain",
    provider: "FreightPath",
    url: "https://gofreightpath.com/",
    cost: "Free",
    description: "Built for frontline workers and leaders — covers routing optimization and AI for daily operations.",
    roles: ["supply_chain"],
    tags: ["AI Agents & Automation"],
  },
  {
    title: "AI in Supply Chain",
    provider: "Coursera",
    url: "https://www.coursera.org/learn/ai-in-supply-chain",
    cost: "Free to audit",
    description: "8-module course covering AI for demand forecasting, inventory management, and logistics.",
    roles: ["supply_chain"],
    tags: ["Data & Analytics", "AI Agents & Automation"],
  },

  // ── Developers & Engineers ──
  {
    title: "Generative AI with LLMs",
    provider: "AWS + DeepLearning.AI / Coursera",
    url: "https://www.coursera.org/learn/generative-ai-with-llms",
    cost: "Free to audit",
    description: "Prompt engineering, fine-tuning, and deployment — requires basic Python knowledge.",
    roles: ["engineering", "data"],
    tags: ["LLMs & Prompting", "AI Coding Tools"],
  },
  {
    title: "Building with the Claude API",
    provider: "Anthropic Academy",
    url: "https://anthropic.skilljar.com/",
    cost: "Free + Certificate",
    description: "Practical API integration, building agents, and production Claude workflows.",
    roles: ["engineering", "data"],
    tags: ["AI Coding Tools", "AI Agents & Automation"],
  },

  // ── Data Analytics ──
  {
    title: "IBM Data Science Professional Certificate",
    provider: "IBM / Coursera",
    url: "https://www.coursera.org/professional-certificates/ibm-data-science",
    cost: "Free to audit",
    description: "12-course suite including 'Generative AI: Elevate Your Data Science Career.'",
    roles: ["data"],
    tags: ["Data & Analytics", "LLMs & Prompting"],
  },
  {
    title: "AI for Data Analysts",
    provider: "IBM SkillsBuild",
    url: "https://skillsbuild.org/learn/course/generative-ai-for-data-analysts",
    cost: "Free",
    description: "Generative AI applied to business intelligence and analytics workflows.",
    roles: ["data"],
    tags: ["Data & Analytics"],
  },

  // ── Cybersecurity ──
  {
    title: "AI-Powered Cybersecurity Fundamentals",
    provider: "Alison",
    url: "https://alison.com/course/ai-powered-cybersecurity-fundamentals",
    cost: "Free + Certificate",
    description: "Core principles of AI-powered threat detection, defense systems, and ethical considerations.",
    roles: ["cybersecurity"],
    tags: ["AI Governance & Ethics"],
  },
  {
    title: "SecureAI",
    provider: "Loyola University Chicago",
    url: "https://secureai.cs.luc.edu",
    cost: "Free + Certificate",
    description: "6-week program covering adversarial attacks, privacy, fairness, and trust in AI systems.",
    duration: "6 weeks",
    roles: ["cybersecurity", "engineering"],
    tags: ["AI Governance & Ethics"],
  },

  // ── HR ──
  {
    title: "Introduction to AI for HR Professionals",
    provider: "Coursera",
    url: "https://www.coursera.org/learn/introduction-to-ai-for-hr-professionals",
    cost: "Free to audit",
    description: "GenAI literacy, key risks, and HR-focused AI tools for recruitment and employee experience.",
    roles: ["hr"],
    tags: ["AI Agents & Automation", "AI Governance & Ethics"],
  },

  // ── General Business / Executive ──
  {
    title: "AI for Everyone",
    provider: "DeepLearning.AI / Andrew Ng",
    url: "https://www.coursera.org/learn/ai-for-everyone",
    cost: "Free + Certificate",
    description: "Non-technical overview — best for executives and cross-functional business leaders.",
    roles: ["executive"],
    seniority: ["Executive", "Founder", "Director"],
    tags: ["AI for Business/GTM"],
  },
  {
    title: "Generative AI for Executives",
    provider: "AWS Skill Builder",
    url: "https://explore.skillbuilder.aws/learn/course/external/view/elearning/16666/generative-ai-for-executives",
    cost: "Free",
    description: "1-hour strategic briefing on AI for business leaders — ROI, risk, and adoption strategy.",
    duration: "1 hour",
    roles: ["executive"],
    seniority: ["Executive", "Founder", "Director", "Manager"],
    tags: ["AI for Business/GTM"],
  },
  {
    title: "OpenAI Academy: AI Foundations",
    provider: "OpenAI / Coursera",
    url: "https://academy.openai.com/",
    cost: "Free + Certificate",
    description: "Official OpenAI certification built with ETS & Pearson — covers AI fundamentals and practical applications.",
    roles: ["executive", "marketing", "sales", "product_management"],
    tags: ["LLMs & Prompting", "AI for Business/GTM"],
  },
];

export function getMatchedCourses(
  role: string | null,
  seniority: string | null,
  industry: string,
  aiInterests: string[],
  maxCourses: number = 4
): TrainingCourse[] {
  const roleCategories = detectRoleCategory(role, seniority);
  const industryCategories = detectIndustryCategory(industry);
  const allCategories = [...new Set([...roleCategories, ...industryCategories])];

  // Score each course
  const scored = TRAINING_COURSES.map(course => {
    let score = 0;

    // Role match (strongest signal)
    const roleMatch = course.roles.some(r => allCategories.includes(r));
    if (roleMatch) score += 10;

    // Industry match
    if (course.industries) {
      const indMatch = course.industries.some(i =>
        industry.toLowerCase().includes(i.replace("_", " "))
      );
      if (indMatch) score += 5;
    }

    // Seniority match
    if (course.seniority && seniority) {
      if (course.seniority.includes(seniority)) score += 3;
    }

    // Interest tag match
    const interestMatch = course.tags.some(t => aiInterests.includes(t));
    if (interestMatch) score += 2;

    return { course, score };
  });

  // Sort by score, take top N
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCourses)
    .map(s => s.course);
}
