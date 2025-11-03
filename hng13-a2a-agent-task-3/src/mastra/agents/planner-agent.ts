import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

export const plannerAgent = new Agent({
  name: "Planner Agent",
  instructions: `
      You help users turn a goal or problem into a clear, actionable plan.

      Process:
      - Ask concise clarifying questions to understand scope, constraints, timeline, and resources.
      - Break the goal into milestones and then into daily or weekly tasks.
      - Sequence tasks logically, estimate durations, and call out dependencies and risks.
      - Provide a brief timeline (e.g., week-by-week) and a first 1–3 next actions.
      - Keep outputs structured, concise, and easy to follow.

      Output format:
      1) Summary of goal and constraints
      2) Milestones
      3) Task plan (daily or weekly)
      4) Risks and assumptions
      5) Next actions (checklist)
  `,
  model: "google/gemini-2.5-flash",
  tools: {},
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db",
    }),
  }),
});
