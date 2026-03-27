import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a mission planner AI for a grid-based exploration game. You receive a grid map and a user's mission briefing, and you must generate a path for the explorer to follow.

GRID LEGEND:
. = empty (walkable)
# = obstacle (impassable - cannot step on these)
C = crystal sample (walkable, worth +10 points to collect)
H = hazard zone (walkable but costs -5 points)
S = start position
G = goal position

RULES:
1. The explorer can move one step at a time: up, down, left, or right (no diagonals)
2. The explorer CANNOT move onto obstacle (#) cells
3. The explorer SHOULD try to reach the goal (G)
4. Crystals (C) are collected automatically when stepped on
5. Hazards (H) apply a penalty when stepped on
6. The path should be efficient - avoid unnecessary wandering
7. Maximum 200 moves allowed

CRITICAL INSTRUCTION: You must faithfully interpret the user's mission briefing to plan the path.
- If they mention collecting crystals/samples, route through crystal cells
- If they mention avoiding hazards, route around hazard cells
- If they mention efficiency or speed, take the shortest path to the goal
- If they mention exploration, visit more of the grid
- If their plan is vague or empty, take a basic direct route to the goal (which will likely be suboptimal)
- The QUALITY of their plan should directly correlate with the QUALITY of the path

ALSO analyze their briefing for planning quality. Check if they mentioned:
- obstacles/walls (awareness of terrain)
- priorities (what matters most)
- crystals/samples/collectibles (bonus objectives)
- hazards/dangers (risk awareness)
- strategy/approach (high-level thinking)
- edge cases/contingencies (what-if thinking)

Respond with ONLY valid JSON in this exact format:
{
  "path": [[x1,y1], [x2,y2], ...],
  "analysis": {
    "mentionedObstacles": true/false,
    "mentionedPriorities": true/false,
    "mentionedCrystals": true/false,
    "mentionedHazards": true/false,
    "mentionedStrategy": true/false,
    "mentionedEdgeCases": true/false
  }
}

The path should start from the cell ADJACENT to S (do not include S itself) and should end ON the goal G cell if reachable. Each [x,y] is a column,row coordinate where x=0 is the leftmost column and y=0 is the top row.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grid, briefing } = body;

    if (!grid || !briefing || typeof briefing !== "string") {
      return NextResponse.json(
        { error: "grid and briefing are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Convert grid to text representation
    const gridText = (grid as number[][])
      .map((row: number[]) =>
        row
          .map((cell: number) => {
            switch (cell) {
              case 0: return ".";
              case 1: return "#";
              case 2: return "C";
              case 3: return "H";
              case 4: return "S";
              case 5: return "G";
              default: return ".";
            }
          })
          .join("")
      )
      .join("\n");

    const userMessage = `GRID MAP (${(grid as number[][])[0].length} columns x ${(grid as number[][]).length} rows):
${gridText}

USER'S MISSION BRIEFING:
${briefing.slice(0, 2000)}

Generate the exploration path based on this briefing. Remember: the quality of the path should reflect the quality of the plan.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```(?:json)?\n?/g, "").trim();
    }

    const parsed = JSON.parse(jsonText);

    // Validate path is array of coordinate pairs
    if (!Array.isArray(parsed.path)) {
      throw new Error("Invalid path format");
    }

    // Clamp path to 200 moves
    if (parsed.path.length > 200) {
      parsed.path = parsed.path.slice(0, 200);
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Pathfinder error:", error);
    if (
      error instanceof Error &&
      (error.message.includes("rate_limit") || error.message.includes("429"))
    ) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
