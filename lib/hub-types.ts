export interface HubPrompt {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: string | null;
  status: "draft" | "approved";
  tags: string[];
  version: string;
  shared: boolean;
  forked_from: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  tools?: HubTool[];
  owner_name?: string;
}

export interface HubTool {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  url: string | null;
  icon_url: string | null;
  notes: string | null;
  shared: boolean;
  forked_from: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  prompts?: HubPrompt[];
  owner_name?: string;
}

export interface HubTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  shared: boolean;
  forked_from: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  tools?: HubTool[];
  prompts?: HubPrompt[];
  owner_name?: string;
}
