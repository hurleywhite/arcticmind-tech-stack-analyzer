"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConversation } from "@11labs/react";
import { voiceToolHandlers, clientToolDefinitions } from "@/lib/voice-tools";

type TranscriptEntry = {
  role: "agent" | "user";
  text: string;
  timestamp: Date;
};

export default function VoiceAgent() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [mode, setMode] = useState<"onboarding" | "qa">("qa");
  const [agentId, setAgentId] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onMessage: (message) => {
      if (message.message) {
        setTranscript((prev) => [
          ...prev,
          { role: message.source === "ai" ? "agent" : "user", text: message.message, timestamp: new Date() },
        ]);
      }
    },
    onError: (error) => {
      console.error("Voice agent error:", error);
      setSessionError("Voice connection lost. Click the mic to reconnect.");
    },
  });

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const startSession = useCallback(async () => {
    setSessionLoading(true);
    setSessionError(null);
    setTranscript([]);

    try {
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Fetch session config from our API
      const res = await fetch("/api/voice/session", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start voice session");
      }

      const session = await res.json();
      setMode(session.mode);
      setAgentId(session.agentId);

      if (!session.agentId) {
        throw new Error("No ElevenLabs Agent ID configured. Add NEXT_PUBLIC_ELEVENLABS_AGENT_ID to your environment.");
      }

      // Build client tools handler map
      const clientTools: Record<string, (params: Record<string, unknown>) => Promise<string>> = {};
      for (const toolDef of clientToolDefinitions) {
        if (voiceToolHandlers[toolDef.name]) {
          clientTools[toolDef.name] = async (params: Record<string, unknown>) => {
            const result = await voiceToolHandlers[toolDef.name](params);
            // Handle onboarding completion redirect
            if (toolDef.name === "completeOnboarding" && result.includes("complete")) {
              setTimeout(() => {
                router.push("/dashboard/news");
                router.refresh();
              }, 2000);
            }
            return result;
          };
        }
      }

      // Start the ElevenLabs conversation
      await conversation.startSession({
        agentId: session.agentId,
        overrides: {
          agent: {
            prompt: {
              prompt: session.systemPrompt,
            },
          },
        },
        clientTools,
      });

      setTranscript([{
        role: "agent",
        text: session.mode === "onboarding"
          ? "Hi! I'm Pulse. I'll help you set up your ArcticPulse feed. Ready to get started?"
          : "Hey! I'm Pulse, your AI news briefing assistant. Ask me about today's digest or anything on your feed.",
        timestamp: new Date(),
      }]);
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : "Failed to start voice session");
    } finally {
      setSessionLoading(false);
    }
  }, [conversation, router]);

  const endSession = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // ignore
    }
    setTranscript([]);
    setIsOpen(false);
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <>
      {/* Floating Mic Button */}
      <button
        onClick={() => {
          if (isOpen) {
            endSession();
          } else {
            setIsOpen(true);
            startSession();
          }
        }}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          isConnected
            ? isSpeaking
              ? "bg-blue-500 shadow-blue-500/30 scale-110"
              : "bg-emerald-500 shadow-emerald-500/30 animate-pulse"
            : sessionLoading
              ? "bg-foreground/20 cursor-wait"
              : "bg-foreground/10 hover:bg-foreground/15 hover:shadow-xl"
        }`}
        title={isConnected ? "End voice session" : "Start voice assistant"}
      >
        {sessionLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : isConnected ? (
          isSpeaking ? (
            // Waveform animation
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-white animate-pulse"
                  style={{
                    height: `${8 + Math.random() * 12}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          ) : (
            // Listening mic (pulsing green)
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )
        ) : (
          // Idle mic
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/50">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </button>

      {/* Transcript Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-h-96 rounded-xl border border-foreground/15 bg-background shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-foreground/30"}`} />
              <span className="text-sm font-medium">
                {mode === "onboarding" ? "Setup Assistant" : "Pulse"}
              </span>
            </div>
            <button
              onClick={endSession}
              className="text-xs text-foreground/40 hover:text-foreground/60"
            >
              End
            </button>
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {sessionError && (
              <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                {sessionError}
              </p>
            )}

            {transcript.map((entry, i) => (
              <div
                key={i}
                className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    entry.role === "user"
                      ? "bg-blue-500/15 text-foreground/80"
                      : "bg-foreground/5 text-foreground/70"
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            ))}

            {isConnected && !isSpeaking && transcript.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-foreground/5 rounded-lg px-3 py-2 text-sm text-foreground/40 italic">
                  Listening...
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Footer hint */}
          <div className="border-t border-foreground/10 px-4 py-2">
            <p className="text-[10px] text-foreground/30 text-center">
              {isConnected ? "Speak naturally — Pulse is listening" : "Click the mic to start"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
