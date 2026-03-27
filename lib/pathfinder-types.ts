export enum CellType {
  Empty = 0,
  Obstacle = 1,
  Crystal = 2,
  Hazard = 3,
  Start = 4,
  Goal = 5,
}

export interface GridCell {
  type: CellType;
  x: number;
  y: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameGrid {
  cells: CellType[][];
  width: number;
  height: number;
  start: Position;
  goal: Position;
  crystals: Position[];
  hazards: Position[];
}

export interface MissionResult {
  path: Position[];
  planningAnalysis: {
    mentionedObstacles: boolean;
    mentionedPriorities: boolean;
    mentionedCrystals: boolean;
    mentionedHazards: boolean;
    mentionedStrategy: boolean;
    mentionedEdgeCases: boolean;
  };
}

export interface ScoreBreakdown {
  reachedGoal: boolean;
  goalPoints: number;
  crystalsCollected: number;
  crystalPoints: number;
  hazardsEntered: number;
  hazardPenalty: number;
  stepsUsed: number;
  efficiencyBonus: number;
  planningBonus: number;
  totalScore: number;
}

export type GamePhase = "planning" | "deploying" | "running" | "debrief";
