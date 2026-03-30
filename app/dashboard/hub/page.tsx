"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { HubPrompt, HubTool, HubTask } from "@/lib/hub-types";
import type { CatalogTool, CatalogPrompt, CatalogTask } from "@/lib/hub-catalog";

type HubTab = "prompts" | "tools" | "tasks";

interface Suggestions {
  tools: CatalogTool[];
  prompts: CatalogPrompt[];
  tasks: CatalogTask[];
}

// ── Modal Component ──
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-foreground/10 bg-background p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function HubPage() {
  const [activeTab, setActiveTab] = useState<HubTab>("tools");
  const [prompts, setPrompts] = useState<HubPrompt[]>([]);
  const [tools, setTools] = useState<HubTool[]>([]);
  const [tasks, setTasks] = useState<HubTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestions>({ tools: [], prompts: [], tasks: [] });
  const [showDiscover, setShowDiscover] = useState(true);
  const [addingItem, setAddingItem] = useState<string | null>(null);

  // Modal state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<HubPrompt | null>(null);
  const [editingTool, setEditingTool] = useState<HubTool | null>(null);
  const [editingTask, setEditingTask] = useState<HubTask | null>(null);

  const [sharedPrompts, setSharedPrompts] = useState<HubPrompt[]>([]);
  const [sharedTools, setSharedTools] = useState<HubTool[]>([]);
  const [sharedTasks, setSharedTasks] = useState<HubTask[]>([]);
  const [showTeamHub, setShowTeamHub] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pRes, tRes, tkRes, sRes, shRes] = await Promise.all([
      fetch("/api/hub/prompts"),
      fetch("/api/hub/tools"),
      fetch("/api/hub/tasks"),
      fetch("/api/hub/suggestions"),
      fetch("/api/hub/shared"),
    ]);
    if (pRes.ok) { const d = await pRes.json(); setPrompts(d.prompts || []); }
    if (tRes.ok) { const d = await tRes.json(); setTools(d.tools || []); }
    if (tkRes.ok) { const d = await tkRes.json(); setTasks(d.tasks || []); }
    if (sRes.ok) { const d = await sRes.json(); setSuggestions(d); }
    if (shRes.ok) { const d = await shRes.json(); setSharedPrompts(d.prompts || []); setSharedTools(d.tools || []); setSharedTasks(d.tasks || []); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function toggleShare(type: "prompts" | "tools" | "tasks", id: string, currentShared: boolean) {
    const endpoint = `/api/hub/${type}`;
    await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, shared: !currentShared }),
    });
    loadData();
  }

  async function forkItem(type: "prompt" | "tool" | "task", id: string) {
    const res = await fetch("/api/hub/fork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    if (res.ok) loadData();
  }

  async function deletePrompt(id: string) {
    if (!confirm("Delete this prompt?")) return;
    await fetch(`/api/hub/prompts?id=${id}`, { method: "DELETE" });
    setPrompts((p) => p.filter((x) => x.id !== id));
  }

  async function deleteTool(id: string) {
    if (!confirm("Delete this tool?")) return;
    await fetch(`/api/hub/tools?id=${id}`, { method: "DELETE" });
    setTools((t) => t.filter((x) => x.id !== id));
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/hub/tasks?id=${id}`, { method: "DELETE" });
    setTasks((t) => t.filter((x) => x.id !== id));
  }

  const filteredPrompts = prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredTools = tools.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  // Get unique tags from all prompts
  const allTags = [...new Set(prompts.flatMap((p) => p.tags))];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tooling Hub</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Manage your AI prompts, tools, and workflows.
          </p>
        </div>
        <button
          onClick={() => {
            if (activeTab === "prompts") { setEditingPrompt(null); setShowPromptModal(true); }
            else if (activeTab === "tools") { setEditingTool(null); setShowToolModal(true); }
            else { setEditingTask(null); setShowTaskModal(true); }
          }}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          + {activeTab === "prompts" ? "New Prompt" : activeTab === "tools" ? "Add Tool" : "Add Task"}
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-foreground/5 p-1">
        {(
          [
            ["tools", "Tools", tools.length],
            ["prompts", "Prompts", prompts.length],
            ["tasks", "Tasks", tasks.length],
          ] as [HubTab, string, number][]
        ).map(([tab, label, count]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/40 hover:text-foreground/60"
            }`}
          >
            {label} {count > 0 && <span className="ml-1 text-foreground/30">({count})</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-2.5 text-sm placeholder:text-foreground/30 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Tag filters for prompts */}
      {activeTab === "prompts" && allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearch(search === tag ? "" : tag)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                search === tag
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* ── DISCOVER SECTION ── */}
      {!loading && (() => {
        const currentSuggestions = activeTab === "prompts" ? suggestions.prompts
          : activeTab === "tools" ? suggestions.tools
          : suggestions.tasks;
        // Filter out items already in user's hub
        const existingNames = new Set(
          activeTab === "prompts" ? prompts.map(p => p.title.toLowerCase())
          : activeTab === "tools" ? tools.map(t => t.name.toLowerCase())
          : tasks.map(t => t.title.toLowerCase())
        );
        const filtered = currentSuggestions.filter(s => {
          const name = ("name" in s ? s.name : s.title).toLowerCase();
          return !existingNames.has(name);
        });
        if (filtered.length === 0) return null;

        return (
          <div className="mb-6">
            <button
              onClick={() => setShowDiscover(!showDiscover)}
              className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span className="text-xs">{showDiscover ? "▾" : "▸"}</span>
              Discover ({filtered.length} suggestions for you)
            </button>
            {showDiscover && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => {
                  const itemName = "name" in item ? item.name : item.title;
                  const itemDesc = item.description;
                  const isAdding = addingItem === itemName;
                  return (
                    <div
                      key={itemName}
                      className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4 transition-all hover:border-emerald-500/25"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground/80">{itemName}</h4>
                        {"url" in item && item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-foreground/30 hover:text-emerald-400 text-xs flex-shrink-0">
                            &nearr;
                          </a>
                        )}
                      </div>
                      <p className="mb-3 text-xs text-foreground/45 line-clamp-2">{itemDesc}</p>
                      {"tags" in item && item.tags?.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400/70">{tag}</span>
                          ))}
                        </div>
                      )}
                      {"linked_tool_names" in item && item.linked_tool_names?.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {item.linked_tool_names.map((name: string) => (
                            <span key={name} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400/70">{name}</span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          setAddingItem(itemName);
                          const res = await fetch("/api/hub/suggestions/add", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: activeTab === "prompts" ? "prompt" : activeTab === "tools" ? "tool" : "task", item }),
                          });
                          if (res.ok) {
                            loadData();
                          }
                          setTimeout(() => setAddingItem(null), 1500);
                        }}
                        disabled={isAdding}
                        className="w-full rounded-lg bg-emerald-600/80 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        {isAdding ? "✓ Added!" : "Add to my hub"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-foreground/40">Loading your hub...</div>
      )}

      {/* ── PROMPTS TAB ── */}
      {!loading && activeTab === "prompts" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-foreground/15 p-8 text-center text-foreground/40">
              No prompts yet. Click &quot;+ New Prompt&quot; to create one.
            </div>
          )}
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 hover:border-foreground/20 transition-colors"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground/90 text-sm leading-snug">{prompt.title}</h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      prompt.status === "approved"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-foreground/10 text-foreground/40"
                    }`}
                  >
                    {prompt.status}
                  </span>
                  <button
                    onClick={() => toggleShare("prompts", prompt.id, prompt.shared)}
                    className={`text-xs transition-colors ${prompt.shared ? "text-emerald-400 hover:text-emerald-300" : "text-foreground/20 hover:text-emerald-400"}`}
                    title={prompt.shared ? "Shared with team" : "Share with team"}
                  >
                    {prompt.shared ? "🔗" : "🔒"}
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="text-foreground/20 hover:text-red-400 transition-colors text-sm"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              </div>
              {prompt.shared && (
                <span className="mb-2 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Shared</span>
              )}
              {prompt.description && (
                <p className="mb-3 text-xs text-foreground/50 line-clamp-2">{prompt.description}</p>
              )}
              {prompt.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {prompt.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-foreground/50">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] text-foreground/30">
                <span>{prompt.version}</span>
                <span>{new Date(prompt.updated_at).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => { setEditingPrompt(prompt); setShowPromptModal(true); }}
                className="mt-3 w-full rounded-lg bg-foreground/5 py-1.5 text-xs font-medium text-foreground/50 hover:bg-foreground/10 hover:text-foreground/70 transition-colors"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TOOLS TAB ── */}
      {!loading && activeTab === "tools" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-foreground/15 p-8 text-center text-foreground/40">
              No tools yet. Click &quot;+ Add Tool&quot; to create one.
            </div>
          )}
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 hover:border-foreground/20 transition-colors"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {tool.icon_url && (
                    <img src={tool.icon_url} alt="" className="h-5 w-5 rounded" />
                  )}
                  <h3 className="font-semibold text-foreground/90 text-sm">{tool.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {tool.url && (
                    <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-foreground/30 hover:text-blue-400 text-xs">
                      &nearr;
                    </a>
                  )}
                  <button
                    onClick={() => toggleShare("tools", tool.id, tool.shared)}
                    className={`text-xs transition-colors ${tool.shared ? "text-emerald-400 hover:text-emerald-300" : "text-foreground/20 hover:text-emerald-400"}`}
                    title={tool.shared ? "Shared with team" : "Share with team"}
                  >
                    {tool.shared ? "🔗" : "🔒"}
                  </button>
                  <button
                    onClick={() => deleteTool(tool.id)}
                    className="text-foreground/20 hover:text-red-400 transition-colors text-sm"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              </div>
              {tool.description && (
                <p className="mb-3 text-xs text-foreground/50 line-clamp-2">{tool.description}</p>
              )}
              {tool.prompts && tool.prompts.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] text-foreground/30 mb-1">Linked Prompts</p>
                  <div className="flex flex-wrap gap-1">
                    {tool.prompts.map((p) => (
                      <span key={p.id} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                        {p.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => { setEditingTool(tool); setShowToolModal(true); }}
                className="mt-3 w-full rounded-lg bg-foreground/5 py-1.5 text-xs font-medium text-foreground/50 hover:bg-foreground/10 hover:text-foreground/70 transition-colors"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TASKS TAB ── */}
      {!loading && activeTab === "tasks" && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTasks.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-foreground/15 p-8 text-center text-foreground/40">
              No tasks yet. Click &quot;+ Add Task&quot; to create one.
            </div>
          )}
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 hover:border-foreground/20 transition-colors"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground/90 text-sm">{task.title}</h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleShare("tasks", task.id, task.shared)}
                    className={`text-xs transition-colors ${task.shared ? "text-emerald-400 hover:text-emerald-300" : "text-foreground/20 hover:text-emerald-400"}`}
                    title={task.shared ? "Shared with team" : "Share with team"}
                  >
                    {task.shared ? "🔗" : "🔒"}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-foreground/20 hover:text-red-400 transition-colors text-sm"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              </div>
              {task.description && (
                <p className="mb-3 text-xs text-foreground/50">{task.description}</p>
              )}
              {task.tools && task.tools.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] text-foreground/30 mb-1">Recommended Tools</p>
                  <div className="flex flex-wrap gap-1">
                    {task.tools.map((t) => (
                      <span key={t.id} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {task.prompts && task.prompts.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] text-foreground/30 mb-1">Prompts</p>
                  <div className="flex flex-wrap gap-1">
                    {task.prompts.map((p) => (
                      <span key={p.id} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                        {p.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                className="mt-3 w-full rounded-lg bg-foreground/5 py-1.5 text-xs font-medium text-foreground/50 hover:bg-foreground/10 hover:text-foreground/70 transition-colors"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TEAM HUB (shared items from teammates) ── */}
      {!loading && (() => {
        const currentShared = activeTab === "prompts" ? sharedPrompts
          : activeTab === "tools" ? sharedTools
          : sharedTasks;
        if (currentShared.length === 0) return null;

        return (
          <div className="mt-8 border-t border-foreground/10 pt-6">
            <button
              onClick={() => setShowTeamHub(!showTeamHub)}
              className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="text-xs">{showTeamHub ? "▾" : "▸"}</span>
              Team Hub ({currentShared.length} shared by teammates)
            </button>
            {showTeamHub && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {currentShared.map((item) => {
                  const itemName = "name" in item ? item.name : item.title;
                  const itemDesc = item.description;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-blue-500/15 bg-blue-500/[0.03] p-4"
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground/80">{itemName}</h4>
                      </div>
                      <p className="mb-1 text-[10px] text-blue-400/60">
                        Shared by {item.owner_name || "teammate"}
                      </p>
                      {itemDesc && (
                        <p className="mb-3 text-xs text-foreground/45 line-clamp-2">{itemDesc}</p>
                      )}
                      <button
                        onClick={() => forkItem(
                          activeTab === "prompts" ? "prompt" : activeTab === "tools" ? "tool" : "task",
                          item.id
                        )}
                        className="w-full rounded-lg bg-blue-600/80 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
                      >
                        Fork to my hub
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── PROMPT MODAL ── */}
      <Modal
        open={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title={editingPrompt ? "Edit Prompt" : "New Prompt"}
      >
        <PromptForm
          prompt={editingPrompt}
          tools={tools}
          onSave={async (data) => {
            const method = editingPrompt ? "PUT" : "POST";
            const body = editingPrompt ? { ...data, id: editingPrompt.id } : data;
            const res = await fetch("/api/hub/prompts", {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (res.ok) {
              setShowPromptModal(false);
              loadData();
            }
          }}
        />
      </Modal>

      {/* ── TOOL MODAL ── */}
      <Modal
        open={showToolModal}
        onClose={() => setShowToolModal(false)}
        title={editingTool ? "Edit Tool" : "Add Tool"}
      >
        <ToolForm
          tool={editingTool}
          onSave={async (data) => {
            const method = editingTool ? "PUT" : "POST";
            const body = editingTool ? { ...data, id: editingTool.id } : data;
            const res = await fetch("/api/hub/tools", {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (res.ok) {
              setShowToolModal(false);
              loadData();
            }
          }}
        />
      </Modal>

      {/* ── TASK MODAL ── */}
      <Modal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={editingTask ? "Edit Task" : "Add Task"}
      >
        <TaskForm
          task={editingTask}
          tools={tools}
          prompts={prompts}
          onSave={async (data) => {
            const method = editingTask ? "PUT" : "POST";
            const body = editingTask ? { ...data, id: editingTask.id } : data;
            const res = await fetch("/api/hub/tasks", {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (res.ok) {
              setShowTaskModal(false);
              loadData();
            }
          }}
        />
      </Modal>
    </div>
  );
}

// ── PROMPT FORM ──
function PromptForm({
  prompt,
  tools,
  onSave,
}: {
  prompt: HubPrompt | null;
  tools: HubTool[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState(prompt?.title || "");
  const [description, setDescription] = useState(prompt?.description || "");
  const [content, setContent] = useState(prompt?.content || "");
  const [status, setStatus] = useState(prompt?.status || "draft");
  const [tags, setTags] = useState(prompt?.tags?.join(", ") || "");
  const [selectedTools, setSelectedTools] = useState<string[]>(
    prompt?.tools?.map((t) => t.id) || []
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      title,
      description,
      content,
      status,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      tool_ids: selectedTools,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">Description</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">Prompt Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6}
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/70">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "approved")}
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/70">Tags (comma-separated)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="research, deck, automation"
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>
      {tools.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/70">Link Tools</label>
          <div className="flex flex-wrap gap-1.5">
            {tools.map((tool) => (
              <button type="button" key={tool.id}
                onClick={() => setSelectedTools((prev) => prev.includes(tool.id) ? prev.filter((id) => id !== tool.id) : [...prev, tool.id])}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedTools.includes(tool.id) ? "bg-blue-500/20 text-blue-400" : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
                }`}
              >
                {tool.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="submit" disabled={saving || !title}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
        {saving ? "Saving..." : prompt ? "Update Prompt" : "Create Prompt"}
      </button>
    </form>
  );
}

// ── TOOL FORM ──
function ToolForm({
  tool,
  onSave,
}: {
  tool: HubTool | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(tool?.name || "");
  const [description, setDescription] = useState(tool?.description || "");
  const [url, setUrl] = useState(tool?.url || "");
  const [iconUrl, setIconUrl] = useState(tool?.icon_url || "");
  const [notes, setNotes] = useState(tool?.notes || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, description, url, icon_url: iconUrl, notes });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">Tool Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">URL</label>
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">Icon URL (optional)</label>
        <input type="url" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://..."
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" />
      </div>
      <button type="submit" disabled={saving || !name}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
        {saving ? "Saving..." : tool ? "Update Tool" : "Add Tool"}
      </button>
    </form>
  );
}

// ── TASK FORM ──
function TaskForm({
  task,
  tools,
  prompts,
  onSave,
}: {
  task: HubTask | null;
  tools: HubTool[];
  prompts: HubPrompt[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [selectedTools, setSelectedTools] = useState<string[]>(
    task?.tools?.map((t) => t.id) || []
  );
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(
    task?.prompts?.map((p) => p.id) || []
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ title, description, tool_ids: selectedTools, prompt_ids: selectedPrompts });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">Task Name</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" />
      </div>
      {tools.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/70">Recommended Tools</label>
          <div className="flex flex-wrap gap-1.5">
            {tools.map((tool) => (
              <button type="button" key={tool.id}
                onClick={() => setSelectedTools((prev) => prev.includes(tool.id) ? prev.filter((id) => id !== tool.id) : [...prev, tool.id])}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedTools.includes(tool.id) ? "bg-blue-500/20 text-blue-400" : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
                }`}
              >
                {tool.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {prompts.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/70">Link Prompts</label>
          <div className="flex flex-wrap gap-1.5">
            {prompts.map((prompt) => (
              <button type="button" key={prompt.id}
                onClick={() => setSelectedPrompts((prev) => prev.includes(prompt.id) ? prev.filter((id) => id !== prompt.id) : [...prev, prompt.id])}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedPrompts.includes(prompt.id) ? "bg-emerald-500/20 text-emerald-400" : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
                }`}
              >
                {prompt.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="submit" disabled={saving || !title}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
        {saving ? "Saving..." : task ? "Update Task" : "Add Task"}
      </button>
    </form>
  );
}
