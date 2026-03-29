"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FeedData } from "@/lib/feed-types";
import SkeletonCard from "@/components/skeleton-card";
import FeedSection from "@/components/feed-section";
import LearningCard from "@/components/learning-card";

export default function LearnPage() {
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(
    new Set()
  );

  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // Load completed courses from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("arcticpulse_courses");
      if (stored) setCompletedCourses(new Set(JSON.parse(stored)));
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCourseComplete(courseTitle: string) {
    setCompletedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseTitle)) {
        next.delete(courseTitle);
      } else {
        next.add(courseTitle);
      }
      try {
        localStorage.setItem(
          "arcticpulse_courses",
          JSON.stringify([...next])
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  // Fetch feed data (uses same cached endpoint as news page)
  useEffect(() => {
    let cancelled = false;

    async function doFetch() {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/feed");
        if (cancelled) return;

        if (!response.ok) {
          let data;
          try {
            data = await response.json();
          } catch {
            data = {};
          }

          if (
            response.status === 404 &&
            data.error?.includes("Profile not found")
          ) {
            if (!cancelled) {
              setError(
                "Your profile isn't set up yet. Please complete onboarding to get personalized learning recommendations."
              );
              setLoading(false);
            }
            fetchingRef.current = false;
            return;
          }
          throw new Error(data.error || "Failed to load learning content");
        }

        const data = await response.json();
        if (cancelled) return;

        if (data.status === "generating") {
          fetchingRef.current = false;
          if (pollCountRef.current < 12) {
            pollCountRef.current++;
            pollTimerRef.current = setTimeout(() => {
              if (!cancelled) doFetch();
            }, 5000);
          } else {
            setError(
              "Content generation is taking longer than expected. Please try again."
            );
            setLoading(false);
          }
          return;
        }
        pollCountRef.current = 0;

        setFeed(data.feed);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        fetchingRef.current = false;
      }
    }

    doFetch();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const learningItems = feed?.learning_skills || [];
  const completedCount = learningItems.filter((item) =>
    completedCourses.has(item.title)
  ).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Learning Hub</h1>
        <p className="mt-1 text-sm text-foreground/50">
          Personalized AI courses and resources based on your role, interests,
          and experience level.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div>
          <div className="mb-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
            <p className="font-medium text-emerald-300">
              Finding learning recommendations for you...
            </p>
            <p className="mt-1 text-sm text-emerald-400/60">
              Matching courses to your interests and experience level.
            </p>
          </div>
          <FeedSection icon="💡" title="Recommended Courses">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </FeedSection>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center">
          <p className="font-medium text-red-300">{error}</p>
          {error.includes("onboarding") ? (
            <Link
              href="/signup"
              className="mt-3 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Complete Setup
            </Link>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Learning content */}
      {feed && !loading && !error && (
        <>
          {/* Progress Ring + Stats */}
          {learningItems.length > 0 && (
            <div className="mb-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-6">
                {/* SVG Progress Ring */}
                <div className="relative flex-shrink-0">
                  <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-foreground/10"
                    />
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="text-emerald-500 transition-all duration-700"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - (learningItems.length > 0 ? completedCount / learningItems.length : 0))}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-400">
                      {learningItems.length > 0 ? Math.round((completedCount / learningItems.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                    Your Learning Path
                  </h3>
                  <p className="mt-1 text-2xl font-bold text-foreground/90">
                    {completedCount} of {learningItems.length}
                  </p>
                  <p className="text-sm text-foreground/40">courses completed</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Next — highlight the first incomplete course */}
          {learningItems.length > 0 && (() => {
            const nextCourse = learningItems.find(
              (item) => !completedCourses.has(item.title)
            );
            if (!nextCourse) return null;
            return (
              <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Up Next
                </p>
                <h3 className="text-lg font-bold text-foreground/90">
                  {nextCourse.title}
                </h3>
                <p className="mt-1 text-sm text-foreground/50">
                  {nextCourse.summary}
                </p>
                {nextCourse.url && (
                  <a
                    href={nextCourse.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                  >
                    Start Learning &rarr;
                  </a>
                )}
              </div>
            );
          })()}

          {/* All Course Cards */}
          {learningItems.length > 0 && (
            <FeedSection icon="💡" title="All Courses">
              {learningItems.map((item, i) => (
                <LearningCard
                  key={`learn-${i}`}
                  item={item}
                  isCompleted={completedCourses.has(item.title)}
                  onToggle={() => toggleCourseComplete(item.title)}
                />
              ))}
            </FeedSection>
          )}

          {/* Empty state */}
          {learningItems.length === 0 && (
            <div className="rounded-xl border border-foreground/10 p-8 text-center">
              <p className="text-foreground/40">
                No learning recommendations yet. Update your interests in{" "}
                <Link
                  href="/dashboard/settings"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Settings
                </Link>{" "}
                to get personalized courses.
              </p>
            </div>
          )}

          {/* Pathfinder CTA */}
          <div className="mt-8 rounded-xl border border-amber-500/15 bg-amber-500/5 p-5 text-center">
            <p className="text-sm font-medium text-amber-300">
              Practice your AI skills
            </p>
            <p className="mt-1 text-xs text-amber-400/60">
              Try the Pathfinder Challenge — an interactive AI prompting exercise.
            </p>
            <Link
              href="/pathfinder"
              className="mt-3 inline-block rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
            >
              Play Pathfinder
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
