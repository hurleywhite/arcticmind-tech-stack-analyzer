"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  CellType,
  GameGrid,
  Position,
  ScoreBreakdown,
  GamePhase,
} from "@/lib/pathfinder-types";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function bfsPathExists(
  cells: CellType[][],
  start: Position,
  goal: Position,
  width: number,
  height: number
): boolean {
  const visited = new Set<string>();
  const queue: Position[] = [start];
  visited.add(`${start.x},${start.y}`);
  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.x === goal.x && curr.y === goal.y) return true;
    for (const d of dirs) {
      const nx = curr.x + d.x;
      const ny = curr.y + d.y;
      const key = `${nx},${ny}`;
      if (
        nx >= 0 && ny >= 0 && nx < width && ny < height &&
        !visited.has(key) && cells[ny][nx] !== CellType.Obstacle
      ) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return false;
}

function bfsShortestPath(grid: GameGrid): number {
  const visited = new Set<string>();
  const queue: { pos: Position; dist: number }[] = [{ pos: grid.start, dist: 0 }];
  visited.add(`${grid.start.x},${grid.start.y}`);
  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];
  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;
    if (pos.x === grid.goal.x && pos.y === grid.goal.y) return dist;
    for (const d of dirs) {
      const nx = pos.x + d.x;
      const ny = pos.y + d.y;
      const key = `${nx},${ny}`;
      if (
        nx >= 0 && ny >= 0 && nx < grid.width && ny < grid.height &&
        !visited.has(key) && grid.cells[ny][nx] !== CellType.Obstacle
      ) {
        visited.add(key);
        queue.push({ pos: { x: nx, y: ny }, dist: dist + 1 });
      }
    }
  }
  return Infinity;
}

function generateGrid(seed: number): GameGrid {
  const width = 16;
  const height = 16;
  const rand = seededRandom(seed);
  const cells: CellType[][] = Array.from({ length: height }, () =>
    Array(width).fill(CellType.Empty)
  );
  const start: Position = { x: 1, y: 1 };
  const goal: Position = { x: width - 2, y: height - 2 };
  cells[start.y][start.x] = CellType.Start;
  cells[goal.y][goal.x] = CellType.Goal;

  const obstacleCount = 20 + Math.floor(rand() * 11);
  let placed = 0;
  let attempts = 0;
  while (placed < obstacleCount && attempts < 500) {
    const x = Math.floor(rand() * width);
    const y = Math.floor(rand() * height);
    if (
      cells[y][x] === CellType.Empty &&
      !(Math.abs(x - start.x) <= 1 && Math.abs(y - start.y) <= 1) &&
      !(Math.abs(x - goal.x) <= 1 && Math.abs(y - goal.y) <= 1)
    ) {
      cells[y][x] = CellType.Obstacle;
      if (bfsPathExists(cells, start, goal, width, height)) {
        placed++;
      } else {
        cells[y][x] = CellType.Empty;
      }
    }
    attempts++;
  }

  const crystals: Position[] = [];
  const crystalCount = 8 + Math.floor(rand() * 5);
  placed = 0;
  attempts = 0;
  while (placed < crystalCount && attempts < 300) {
    const x = Math.floor(rand() * width);
    const y = Math.floor(rand() * height);
    if (cells[y][x] === CellType.Empty) {
      cells[y][x] = CellType.Crystal;
      crystals.push({ x, y });
      placed++;
    }
    attempts++;
  }

  const hazards: Position[] = [];
  const hazardCount = 4 + Math.floor(rand() * 3);
  placed = 0;
  attempts = 0;
  while (placed < hazardCount && attempts < 200) {
    const x = Math.floor(rand() * width);
    const y = Math.floor(rand() * height);
    if (cells[y][x] === CellType.Empty) {
      cells[y][x] = CellType.Hazard;
      hazards.push({ x, y });
      placed++;
    }
    attempts++;
  }

  return { cells, width, height, start, goal, crystals, hazards };
}

const CELL_COLORS: Record<CellType, string> = {
  [CellType.Empty]: "bg-slate-800/50",
  [CellType.Obstacle]: "bg-slate-600",
  [CellType.Crystal]: "bg-cyan-500/30 border border-cyan-400/50",
  [CellType.Hazard]: "bg-red-500/25 border border-red-400/40",
  [CellType.Start]: "bg-emerald-500/30 border border-emerald-400/50",
  [CellType.Goal]: "bg-amber-500/30 border border-amber-400/50",
};

function ScoreRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800">
      <span className="text-slate-400">{label}</span>
      <span className={`font-mono font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>
        {value}
      </span>
    </div>
  );
}

function AnalysisItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs ${checked ? "text-emerald-400" : "text-slate-600"}`}>
        {checked ? "\u2713" : "\u2717"}
      </span>
      <span className={checked ? "text-slate-300" : "text-slate-600"}>{label}</span>
    </div>
  );
}

export default function PathfinderPage() {
  const [grid, setGrid] = useState<GameGrid | null>(null);
  const [briefing, setBriefing] = useState("");
  const [phase, setPhase] = useState<GamePhase>("planning");
  const [explorerPos, setExplorerPos] = useState<Position | null>(null);
  const [path, setPath] = useState<Position[]>([]);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, boolean> | null>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const seed = Math.floor(Date.now() / 3600000);
    const g = generateGrid(seed);
    setGrid(g);
    setExplorerPos(g.start);
  }, []);

  const resetGame = useCallback(() => {
    const seed = Math.floor(Date.now() / 3600000);
    const g = generateGrid(seed);
    setGrid(g);
    setExplorerPos(g.start);
    setBriefing("");
    setPhase("planning");
    setPath([]);
    setVisitedCells(new Set());
    setCurrentStep(0);
    setScore(null);
    setError(null);
    setAnalysis(null);
    if (animationRef.current) clearTimeout(animationRef.current);
  }, []);

  const newMap = useCallback(() => {
    const seed = Math.floor(Math.random() * 999999);
    const g = generateGrid(seed);
    setGrid(g);
    setExplorerPos(g.start);
    setBriefing("");
    setPhase("planning");
    setPath([]);
    setVisitedCells(new Set());
    setCurrentStep(0);
    setScore(null);
    setError(null);
    setAnalysis(null);
    if (animationRef.current) clearTimeout(animationRef.current);
  }, []);

  const calculateScore = useCallback(() => {
    if (!grid || !explorerPos) return;
    const reachedGoal = explorerPos.x === grid.goal.x && explorerPos.y === grid.goal.y;
    const goalPoints = reachedGoal ? 100 : 0;

    let crystalsCollected = 0;
    for (const crystal of grid.crystals) {
      if (visitedCells.has(`${crystal.x},${crystal.y}`)) crystalsCollected++;
    }
    const crystalPoints = crystalsCollected * 10;

    let hazardsEntered = 0;
    for (const hazard of grid.hazards) {
      if (visitedCells.has(`${hazard.x},${hazard.y}`)) hazardsEntered++;
    }
    const hazardPenalty = hazardsEntered * 5;

    const shortestPath = bfsShortestPath(grid);
    const stepsUsed = path.length;
    let efficiencyBonus = 0;
    if (reachedGoal && shortestPath < Infinity) {
      const ratio = shortestPath / Math.max(stepsUsed, 1);
      efficiencyBonus = Math.round(Math.min(ratio, 1) * 20);
    }

    let planningBonus = 0;
    if (analysis) {
      const trueCount = Object.values(analysis).filter(Boolean).length;
      planningBonus = trueCount * 5;
    }

    const totalScore = goalPoints + crystalPoints - hazardPenalty + efficiencyBonus + planningBonus;
    setScore({
      reachedGoal, goalPoints, crystalsCollected, crystalPoints,
      hazardsEntered, hazardPenalty, stepsUsed, efficiencyBonus, planningBonus, totalScore,
    });
    setPhase("debrief");
  }, [grid, explorerPos, visitedCells, path, analysis]);

  useEffect(() => {
    if (phase !== "running" || !grid || path.length === 0) return;
    if (currentStep >= path.length) {
      calculateScore();
      return;
    }
    animationRef.current = setTimeout(() => {
      const nextPos = path[currentStep];
      if (
        nextPos && nextPos.x >= 0 && nextPos.y >= 0 &&
        nextPos.x < grid.width && nextPos.y < grid.height &&
        grid.cells[nextPos.y][nextPos.x] !== CellType.Obstacle
      ) {
        setExplorerPos(nextPos);
        setVisitedCells((prev) => {
          const next = new Set(prev);
          next.add(`${nextPos.x},${nextPos.y}`);
          return next;
        });
      }
      setCurrentStep((prev) => prev + 1);
    }, 180);
    return () => { if (animationRef.current) clearTimeout(animationRef.current); };
  }, [phase, currentStep, path, grid, calculateScore]);

  const deployMission = async () => {
    if (!grid || !briefing.trim()) return;
    setPhase("deploying");
    setError(null);
    try {
      const response = await fetch("/api/pathfinder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid: grid.cells, briefing: briefing.trim() }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process mission briefing");
      }
      const data = await response.json();
      if (!Array.isArray(data.path) || data.path.length === 0) {
        throw new Error("AI returned an empty path. Try a more detailed plan.");
      }
      const parsedPath: Position[] = data.path.map((p: number[]) => ({ x: p[0], y: p[1] }));
      setPath(parsedPath);
      setAnalysis(data.analysis || null);
      setCurrentStep(0);
      setVisitedCells(new Set());
      setExplorerPos(grid.start);
      setPhase("running");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("planning");
    }
  };

  if (!grid) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Generating terrain...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-1">
              ArcticMind Challenge
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Pathfinder</h1>
          </div>
          <a href="/" className="text-sm text-slate-500 hover:text-slate-300 transition">
            Home
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        {phase === "planning" && (
          <div className="mb-6 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
              Plan the Mission. Deploy the AI.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Your explorer needs to reach the goal. Write a mission briefing — the AI will
              follow your plan exactly as written. No course corrections once deployed.
              How well you plan determines how well it performs.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grid */}
          <div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                  Terrain Map
                </h3>
                {phase === "planning" && (
                  <button onClick={newMap} className="text-xs text-slate-500 hover:text-slate-300 transition">
                    New Map
                  </button>
                )}
              </div>
              <div
                className="grid gap-px bg-slate-700/30 rounded-lg overflow-hidden aspect-square"
                style={{ gridTemplateColumns: `repeat(${grid.width}, 1fr)` }}
              >
                {grid.cells.flatMap((row, y) =>
                  row.map((cell, x) => {
                    const isExplorer = explorerPos?.x === x && explorerPos?.y === y;
                    const isVisited = visitedCells.has(`${x},${y}`);
                    const isOnPath = path.some((p) => p.x === x && p.y === y);
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`relative flex items-center justify-center text-xs ${CELL_COLORS[cell]} ${isVisited && !isExplorer ? "ring-1 ring-emerald-500/30" : ""} ${phase === "debrief" && isOnPath && !isExplorer ? "ring-1 ring-cyan-500/20" : ""} transition-all duration-100`}
                        style={{ aspectRatio: "1" }}
                      >
                        {isExplorer ? (
                          <span className="text-emerald-400 font-bold text-[10px] sm:text-xs drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]">{"\u25CF"}</span>
                        ) : cell === CellType.Obstacle ? (
                          <span className="text-slate-500 text-[8px] sm:text-[10px]">{"\u2588"}</span>
                        ) : (
                          <span className={`text-[8px] sm:text-[10px] ${cell === CellType.Crystal ? "text-cyan-300" : cell === CellType.Hazard ? "text-red-400" : cell === CellType.Goal ? "text-amber-400" : "text-transparent"}`}>
                            {cell === CellType.Crystal ? "\u25C6" : cell === CellType.Hazard ? "\u26A0" : cell === CellType.Goal ? "\u2691" : ""}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-[10px] sm:text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/40 inline-block" /> Start</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/40 inline-block" /> Goal</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-500/40 inline-block" /> Crystal (+10)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/40 inline-block" /> Hazard (-5)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-600 inline-block" /> Obstacle</span>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div>
            {phase === "planning" && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
                <h3 className="text-lg font-bold text-white mb-1">Mission Briefing</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Write your plan below. The better your plan, the better the AI performs.
                  Once deployed, there are no changes.
                </p>
                <textarea
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  placeholder={"Describe your mission plan for the explorer...\n\nConsider:\n- What's the primary objective?\n- How should it handle obstacles?\n- Should it collect crystal samples?\n- How should it deal with hazard zones?\n- What's the overall strategy?"}
                  className="w-full h-48 sm:h-56 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                />
                {error && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}
                <button
                  onClick={deployMission}
                  disabled={!briefing.trim()}
                  className="mt-4 w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                >
                  Deploy Mission
                </button>
                <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <strong className="text-slate-400">The Lesson:</strong> In real AI work, most people
                    type a quick prompt and hope for the best. Professionals plan first — defining objectives,
                    constraints, and success criteria before engaging AI. This challenge proves why that matters.
                  </p>
                </div>
              </div>
            )}

            {phase === "deploying" && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm">AI is interpreting your mission briefing...</p>
                <p className="text-slate-600 text-xs mt-2">Generating navigation path from your plan</p>
              </div>
            )}

            {phase === "running" && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <h3 className="text-lg font-bold text-white">Mission in Progress</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Steps taken</span>
                    <span className="text-slate-300 font-mono">{currentStep} / {path.length}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${(currentStep / Math.max(path.length, 1)) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-4">
                    Watching the AI execute your plan. No changes possible now...
                  </p>
                </div>
                <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Your briefing:</p>
                  <p className="text-xs text-slate-400 line-clamp-4">{briefing}</p>
                </div>
              </div>
            )}

            {phase === "debrief" && score && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
                <h3 className="text-lg font-bold text-white mb-4">Mission Debrief</h3>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-white mb-1">{score.totalScore}</div>
                  <div className="text-sm text-slate-500">Mission Score</div>
                </div>
                <div className="space-y-2 mb-6">
                  <ScoreRow label="Reached Goal" value={score.reachedGoal ? `+${score.goalPoints}` : "MISSED"} positive={score.reachedGoal} />
                  <ScoreRow label={`Crystals (${score.crystalsCollected}/${grid.crystals.length})`} value={`+${score.crystalPoints}`} positive={score.crystalPoints > 0} />
                  {score.hazardsEntered > 0 && (
                    <ScoreRow label={`Hazards Hit (${score.hazardsEntered})`} value={`-${score.hazardPenalty}`} positive={false} />
                  )}
                  <ScoreRow label={`Efficiency (${score.stepsUsed} steps)`} value={`+${score.efficiencyBonus}`} positive={score.efficiencyBonus > 0} />
                  <ScoreRow label="Planning Quality" value={`+${score.planningBonus}`} positive={score.planningBonus > 0} />
                </div>
                {analysis && (
                  <div className="mb-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Plan Coverage</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <AnalysisItem label="Terrain awareness" checked={analysis.mentionedObstacles} />
                      <AnalysisItem label="Clear priorities" checked={analysis.mentionedPriorities} />
                      <AnalysisItem label="Sample collection" checked={analysis.mentionedCrystals} />
                      <AnalysisItem label="Risk awareness" checked={analysis.mentionedHazards} />
                      <AnalysisItem label="Strategy defined" checked={analysis.mentionedStrategy} />
                      <AnalysisItem label="Edge cases" checked={analysis.mentionedEdgeCases} />
                    </div>
                  </div>
                )}
                <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg mb-4">
                  <p className="text-xs text-cyan-300/80 leading-relaxed">
                    <strong className="text-cyan-300">The Takeaway:</strong>{" "}
                    {score.totalScore >= 130
                      ? "Excellent planning. Your structured approach produced a high-quality result \u2014 exactly what happens when you plan AI interactions carefully before executing."
                      : score.totalScore >= 80
                        ? "Decent result, but there's room for improvement. The more specific and structured your plan, the better the AI performs. Try adding priorities, edge cases, and explicit strategies."
                        : "This is what happens when you deploy without a real plan. In AI work, vague instructions produce vague results. Try again with a structured briefing \u2014 define objectives, strategy, and constraints."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetGame} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors text-sm">
                    Try Again (Same Map)
                  </button>
                  <button onClick={newMap} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-sm">
                    New Map
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
