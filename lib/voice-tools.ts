import { createClient } from "@/lib/supabase/client";

type ToolHandler = (params: Record<string, unknown>) => Promise<string>;

async function getAuthUserId(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── ONBOARDING TOOLS ───

const updateRole: ToolHandler = async (params) => {
  const role = params.role as string;
  if (!role) return "No role provided";
  const userId = await getAuthUserId();
  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return `Error saving role: ${error.message}`;
  return `Role updated to "${role}"`;
};

const updateSeniority: ToolHandler = async (params) => {
  const seniority = params.seniority as string;
  const valid = ["Executive", "Founder", "Director", "Manager", "Team Lead", "Specialist"];
  if (!valid.includes(seniority)) return `Invalid seniority. Options: ${valid.join(", ")}`;
  const userId = await getAuthUserId();
  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ seniority })
    .eq("id", userId);
  if (error) return `Error saving seniority: ${error.message}`;
  return `Seniority updated to "${seniority}"`;
};

const updateCompany: ToolHandler = async (params) => {
  const companyDomain = params.company_domain as string;
  const companyName = params.company_name as string;
  if (!companyDomain && !companyName) return "No company info provided";
  const userId = await getAuthUserId();
  const supabase = createClient();

  const updates: Record<string, string> = {};
  if (companyDomain) updates.company_domain = companyDomain;
  if (companyName) updates.company_name = companyName;

  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId);
  if (error) return `Error saving company: ${error.message}`;

  // Trigger company analysis in background
  if (companyDomain || companyName) {
    fetch("/api/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyUrl: companyDomain || companyName }),
    }).catch(() => {});
  }

  return `Company updated to "${companyName || companyDomain}"`;
};

const updateAiExperience: ToolHandler = async (params) => {
  const level = params.level as string;
  const valid = ["beginner", "intermediate", "advanced", "expert"];
  if (!valid.includes(level)) return `Invalid level. Options: ${valid.join(", ")}`;
  const userId = await getAuthUserId();
  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ ai_experience_level: level })
    .eq("id", userId);
  if (error) return `Error saving experience level: ${error.message}`;
  return `AI experience updated to "${level}"`;
};

const updateInterests: ToolHandler = async (params) => {
  const interests = params.interests as string[];
  if (!interests || interests.length === 0) return "No interests provided";
  const userId = await getAuthUserId();
  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ ai_interests: interests })
    .eq("id", userId);
  if (error) return `Error saving interests: ${error.message}`;
  return `Interests updated: ${interests.join(", ")}`;
};

const updateGoals: ToolHandler = async (params) => {
  const goals = params.goals as string[];
  if (!goals || goals.length === 0) return "No goals provided";
  const userId = await getAuthUserId();
  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ ai_goals: goals })
    .eq("id", userId);
  if (error) return `Error saving goals: ${error.message}`;
  return `Goals updated: ${goals.join(", ")}`;
};

const updateContentPreferences: ToolHandler = async (params) => {
  const contentDepth = params.content_depth as string;
  const toolingFocus = params.tooling_focus as string;
  const updates: Record<string, string> = {};
  if (contentDepth) updates.content_depth = contentDepth;
  if (toolingFocus) updates.tooling_focus = toolingFocus;
  if (Object.keys(updates).length === 0) return "No preferences provided";
  const userId = await getAuthUserId();
  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId);
  if (error) return `Error saving preferences: ${error.message}`;
  return `Content preferences updated`;
};

const completeOnboarding: ToolHandler = async () => {
  const userId = await getAuthUserId();
  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ onboarding_completed: true })
    .eq("id", userId);
  if (error) return `Error completing onboarding: ${error.message}`;
  // Redirect handled by the component
  return "Onboarding complete! Redirecting to your feed...";
};

// ─── ARTICLE Q&A TOOLS ───

const bookmarkArticle: ToolHandler = async (params) => {
  const articleUrl = params.article_url as string;
  const articleTitle = params.article_title as string;
  const feedback = params.feedback as string;
  if (!articleUrl) return "No article URL provided";

  // Save bookmark
  await fetch("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      article_url: articleUrl,
      article_title: articleTitle || "",
    }),
  });

  // Also save feedback if provided
  if (feedback === "up" || feedback === "down") {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_url: articleUrl,
        article_title: articleTitle || "",
        feedback,
      }),
    });
  }

  return `Article "${articleTitle || articleUrl}" saved`;
};

const openArticle: ToolHandler = async (params) => {
  const url = params.url as string;
  if (!url) return "No URL provided";
  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
  return `Opening article in new tab`;
};

// ─── TOOL REGISTRY ───

export const voiceToolHandlers: Record<string, ToolHandler> = {
  updateRole,
  updateSeniority,
  updateCompany,
  updateAiExperience,
  updateInterests,
  updateGoals,
  updateContentPreferences,
  completeOnboarding,
  bookmarkArticle,
  openArticle,
};

// Client tool definitions for ElevenLabs SDK
export const clientToolDefinitions = [
  {
    name: "updateRole",
    description: "Save the user's job role/title",
    parameters: {
      type: "object" as const,
      properties: {
        role: { type: "string", description: "The user's job title, e.g. Product Manager, Data Engineer, CEO" },
      },
      required: ["role"],
    },
  },
  {
    name: "updateSeniority",
    description: "Save the user's seniority level",
    parameters: {
      type: "object" as const,
      properties: {
        seniority: { type: "string", enum: ["Executive", "Founder", "Director", "Manager", "Team Lead", "Specialist"], description: "The user's seniority level" },
      },
      required: ["seniority"],
    },
  },
  {
    name: "updateCompany",
    description: "Save the user's company information and trigger analysis",
    parameters: {
      type: "object" as const,
      properties: {
        company_domain: { type: "string", description: "Company website domain, e.g. snowflake.com" },
        company_name: { type: "string", description: "Company name, e.g. Snowflake" },
      },
    },
  },
  {
    name: "updateAiExperience",
    description: "Save the user's AI experience level",
    parameters: {
      type: "object" as const,
      properties: {
        level: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"], description: "AI experience level" },
      },
      required: ["level"],
    },
  },
  {
    name: "updateInterests",
    description: "Save the user's AI topic interests",
    parameters: {
      type: "object" as const,
      properties: {
        interests: { type: "array", items: { type: "string" }, description: "Array of AI topic interests" },
      },
      required: ["interests"],
    },
  },
  {
    name: "updateGoals",
    description: "Save what the user is trying to accomplish with AI",
    parameters: {
      type: "object" as const,
      properties: {
        goals: { type: "array", items: { type: "string" }, description: "Array of AI goals" },
      },
      required: ["goals"],
    },
  },
  {
    name: "updateContentPreferences",
    description: "Save the user's content depth and tooling focus preferences",
    parameters: {
      type: "object" as const,
      properties: {
        content_depth: { type: "string", enum: ["high_level", "balanced", "deep_technical"], description: "Content depth preference" },
        tooling_focus: { type: "string", enum: ["strategy_first", "balanced", "tools_first"], description: "Strategy vs tools focus" },
      },
    },
  },
  {
    name: "completeOnboarding",
    description: "Mark onboarding as complete and redirect to the news feed",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "bookmarkArticle",
    description: "Save an article to the user's bookmarks, optionally with feedback",
    parameters: {
      type: "object" as const,
      properties: {
        article_url: { type: "string", description: "The article URL" },
        article_title: { type: "string", description: "The article title" },
        feedback: { type: "string", enum: ["up", "down"], description: "Optional thumbs up/down feedback" },
      },
      required: ["article_url"],
    },
  },
  {
    name: "openArticle",
    description: "Open an article URL in the user's browser",
    parameters: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "The article URL to open" },
      },
      required: ["url"],
    },
  },
];
