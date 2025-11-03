# Building an Intelligent Planner Agent with Mastra AI

In today's fast-paced world, turning ideas and goals into actionable plans is crucial for success. That's why I built a **Planner Agent** using Mastra AI—an intelligent agent that helps users transform goals and problems into clear, structured, and actionable plans. In this blog post, I'll walk you through how I implemented this agent and the powerful features that make it effective.

## What is Mastra AI?

[Mastra AI](https://mastra.ai/) is a modern TypeScript framework for building production-ready AI agents, workflows, and applications. It provides a comprehensive toolkit for creating intelligent agents with features like:

- **Memory Management**: Persistent conversation memory across sessions
- **Tool Integration**: Easy integration of external tools and APIs
- **Workflow Orchestration**: Complex multi-step workflows
- **Observability**: Built-in logging and tracing
- **API Routes**: Standard HTTP endpoints for agent interactions

Mastra AI abstracts away the complexity of building AI agents, allowing developers to focus on defining agent behavior and capabilities rather than infrastructure concerns.

## The Planner Agent: Overview

The Planner Agent is designed to help users break down goals into actionable plans. It takes a user's goal or problem and transforms it into:

1. **Clear milestones** with logical sequencing
2. **Daily or weekly task breakdowns** with estimated durations
3. **Risk identification** and dependency mapping
4. **Timeline visualization** (e.g., week-by-week)
5. **Immediate next actions** in a checklist format

## Implementation Deep Dive

Let's examine the core implementation of the Planner Agent:

```typescript
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
```

### Key Components

#### 1. **Agent Instructions**

The instructions field is crucial—it defines the agent's personality, behavior, and output format. The Planner Agent's instructions guide it to:

- **Ask clarifying questions** to understand the full context
- **Break down goals** into manageable milestones and tasks
- **Sequence logically** with dependency awareness
- **Provide structured output** in a consistent format

This structured approach ensures users receive consistent, actionable plans every time.

#### 2. **Model Selection**

The agent uses `google/gemini-2.5-flash`, a fast and efficient model from Google's Gemini family. This model provides:

- **Fast response times** for real-time interactions
- **Strong reasoning capabilities** for complex planning scenarios
- **Cost-effective** for high-volume usage

Mastra AI supports multiple model providers, so you can easily switch between OpenAI, Anthropic, Google, and others based on your needs.

#### 3. **Memory Management**

One of the most powerful features is the persistent memory system:

```typescript
memory: new Memory({
  storage: new LibSQLStore({
    url: "file:../mastra.db",
  }),
});
```

The Planner Agent uses **LibSQLStore** for persistent storage, which means:

- **Conversation context** is maintained across sessions
- **Previous plans** can be referenced and refined
- **User preferences** are remembered for future interactions

This creates a more personalized and context-aware planning experience. The memory system stores conversation history, allowing the agent to build upon previous interactions and understand user preferences over time.

#### 4. **Tools Integration**

Currently, the Planner Agent has an empty tools object (`tools: {}`), but Mastra AI makes it easy to extend functionality. You could add tools for:

- **Calendar integration** to check availability
- **Task management APIs** to create tasks in external systems
- **Research tools** to gather information about the goal
- **Notification systems** to send reminders

For example, here's how you might add a tool (similar to the weather agent in the same project):

```typescript
tools: {
  createTask: createTool({
    id: 'create-task',
    description: 'Create a task in a task management system',
    inputSchema: z.object({
      title: z.string(),
      dueDate: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
    }),
    execute: async ({ context }) => {
      // Implementation for creating tasks
    },
  }),
}
```

## Integration with A2A Protocol

The Planner Agent is integrated into an **Agent-to-Agent (A2A) protocol** system, following the JSON-RPC 2.0 specification. This allows the agent to be accessed via a standardized API endpoint:

```typescript
POST / a2a / agent / plannerAgent;
```

The A2A route handler:

1. **Validates JSON-RPC 2.0 requests** with proper error handling
2. **Retrieves the agent** from the Mastra instance
3. **Processes messages** in the A2A format
4. **Generates responses** using the agent
5. **Returns structured responses** with artifacts and conversation history

This standardization makes it easy to integrate the Planner Agent into larger systems where multiple agents need to communicate with each other or with external services.

## Example Usage

Here's how you might interact with the Planner Agent via the A2A endpoint:

```json
{
  "jsonrpc": "2.0",
  "id": "123",
  "method": "generate",
  "params": {
    "message": {
      "role": "user",
      "content": "I want to build a mobile app in 3 months",
      "contextId": "user-123",
      "taskId": "task-456"
    }
  }
}
```

The agent would respond with a structured plan including milestones, tasks, risks, and next actions—all formatted according to its instructions.

## Benefits of This Architecture

### 1. **Separation of Concerns**

The agent definition is clean and focused. Infrastructure concerns (memory storage, API routing, observability) are handled by Mastra AI, allowing you to focus on agent behavior.

### 2. **Scalability**

The architecture supports:

- **Multiple agents** in a single Mastra instance
- **Workflows** that can orchestrate multiple agents
- **Horizontal scaling** via stateless API routes

### 3. **Observability**

Mastra AI includes built-in observability features:

- Request/response logging
- Performance metrics
- AI tracing for debugging

### 4. **Type Safety**

With TypeScript and Zod schemas, you get:

- Compile-time type checking
- Runtime validation
- Better IDE autocomplete

## Future Enhancements

The Planner Agent has room for growth. Potential enhancements include:

1. **Tool Integration**: Add calendar APIs, task management systems, or research tools
2. **Multi-Agent Collaboration**: Work with other agents (like a weather agent) to create more context-aware plans
3. **Workflow Integration**: Create workflows that combine planning with execution
4. **Advanced Memory**: Implement semantic search over past plans for better recommendations
5. **Custom Scorers**: Add evaluation metrics to ensure plan quality

## Conclusion

Building the Planner Agent with Mastra AI was a smooth experience. The framework handles the complex parts of AI agent development (memory, routing, observability) while providing a clean, intuitive API for defining agent behavior.

The Planner Agent demonstrates how Mastra AI enables developers to create production-ready AI agents quickly. With persistent memory, easy tool integration, and standardized API routes, you can build sophisticated AI applications that maintain context, integrate with external systems, and scale effectively.

Whether you're building a personal planning assistant, a project management tool, or a complex multi-agent system, Mastra AI provides the foundation you need to succeed.

---

**Key Takeaways:**

- ✅ Mastra AI simplifies building production-ready AI agents
- ✅ Persistent memory creates personalized, context-aware experiences
- ✅ The A2A protocol enables standardized agent communication
- ✅ Clean separation of concerns makes code maintainable and extensible
- ✅ TypeScript + Zod provide type safety and runtime validation

Ready to build your own AI agent? Check out the [Mastra AI documentation](https://docs.mastra.ai/) and start creating intelligent applications today!
