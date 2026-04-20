// src/lib/langgraph.ts
// LangGraph integration — defines a stateful agent workflow graph
// Implements a multi-step educational pipeline:
//   Plan → Test → Grade → Feedback
// Each node is a distinct agent that processes its slice of the state

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { planChain, testChain, feedbackChain, textLLM, jsonParser } from "./langchain";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// ── State Definition ────────────────────────────────────────────────────────
// LangGraph Annotation-based state schema for the educational agent workflow

export const EduAgentState = Annotation.Root({
  // Input fields
  subjectName: Annotation<string>,
  subjectId: Annotation<string>,
  userId: Annotation<string>,

  // Plan node output
  plan: Annotation<Record<string, unknown> | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Test node output
  test: Annotation<Record<string, unknown> | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Topics used for test generation
  completedTopics: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  // Grade node output
  grading: Annotation<Record<string, unknown> | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Feedback node output
  feedback: Annotation<Record<string, unknown> | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Test results (input to feedback node)
  testResults: Annotation<Record<string, unknown> | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Workflow tracking
  currentStep: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "idle",
  }),
  error: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

// Type alias for the state
export type EduAgentStateType = typeof EduAgentState.State;

// ── Node Functions ──────────────────────────────────────────────────────────

/** Planning Node — generates a 4-week study plan */
async function planNode(
  state: EduAgentStateType
): Promise<Partial<EduAgentStateType>> {
  try {
    console.log("[LangGraph] planNode: generating study plan for", state.subjectName);
    const plan = await planChain.invoke({
      subjectName: state.subjectName,
    });
    return { plan: plan as Record<string, unknown>, currentStep: "plan_complete" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Plan generation failed";
    console.error("[LangGraph] planNode error:", msg);
    return { error: msg, currentStep: "error" };
  }
}

/** Test Generation Node — creates a mock test from topics */
async function testNode(
  state: EduAgentStateType
): Promise<Partial<EduAgentStateType>> {
  try {
    const topics = state.completedTopics;
    if (!topics || topics.length === 0) {
      return { error: "No topics available for test generation", currentStep: "error" };
    }
    console.log("[LangGraph] testNode: generating test for", state.subjectName);
    const test = await testChain.invoke({
      subjectName: state.subjectName,
      topicList: topics.join(", "),
    });
    return { test: test as Record<string, unknown>, currentStep: "test_complete" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Test generation failed";
    console.error("[LangGraph] testNode error:", msg);
    return { error: msg, currentStep: "error" };
  }
}

/** Feedback Node — analyses test results and provides recommendations */
async function feedbackNode(
  state: EduAgentStateType
): Promise<Partial<EduAgentStateType>> {
  try {
    if (!state.testResults) {
      return { error: "No test results to analyse", currentStep: "error" };
    }
    console.log("[LangGraph] feedbackNode: generating feedback for", state.subjectName);
    const feedback = await feedbackChain.invoke({
      subjectName: state.subjectName,
      testResults: JSON.stringify(state.testResults, null, 2),
    });
    return { feedback: feedback as Record<string, unknown>, currentStep: "feedback_complete" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Feedback generation failed";
    console.error("[LangGraph] feedbackNode error:", msg);
    return { error: msg, currentStep: "error" };
  }
}

// ── Routing Functions ───────────────────────────────────────────────────────

/** Route after plan: if topics available, proceed to test; else end */
function routeAfterPlan(state: EduAgentStateType): string {
  if (state.error) return END;
  if (state.completedTopics && state.completedTopics.length > 0) {
    return "test_agent";
  }
  return END;
}

/** Route after test: if test results exist, proceed to feedback; else end */
function routeAfterTest(state: EduAgentStateType): string {
  if (state.error) return END;
  if (state.testResults) {
    return "feedback_agent";
  }
  return END;
}

// ── Graph Builder ───────────────────────────────────────────────────────────

/**
 * Build the complete educational agent workflow graph.
 *
 * Graph structure:
 *   START → plan_agent → (conditional) → test_agent → (conditional) → feedback_agent → END
 *
 * Each node can independently end the graph if there's an error
 * or if required data for the next step is missing.
 */
export function buildEduAgentGraph() {
  const graph = new StateGraph(EduAgentState)
    // Add agent nodes
    .addNode("plan_agent", planNode)
    .addNode("test_agent", testNode)
    .addNode("feedback_agent", feedbackNode)

    // Define edges
    .addEdge(START, "plan_agent")
    .addConditionalEdges("plan_agent", routeAfterPlan, ["test_agent", END])
    .addConditionalEdges("test_agent", routeAfterTest, ["feedback_agent", END])
    .addEdge("feedback_agent", END);

  return graph.compile();
}

// ── Individual Agent Graphs (for single-step API routes) ────────────────────

/** Build a single-node graph for plan generation only */
export function buildPlanGraph() {
  const graph = new StateGraph(EduAgentState)
    .addNode("plan_agent", planNode)
    .addEdge(START, "plan_agent")
    .addEdge("plan_agent", END);

  return graph.compile();
}

/** Build a single-node graph for test generation only */
export function buildTestGraph() {
  const graph = new StateGraph(EduAgentState)
    .addNode("test_agent", testNode)
    .addEdge(START, "test_agent")
    .addEdge("test_agent", END);

  return graph.compile();
}

/** Build a single-node graph for feedback generation only */
export function buildFeedbackGraph() {
  const graph = new StateGraph(EduAgentState)
    .addNode("feedback_agent", feedbackNode)
    .addEdge(START, "feedback_agent")
    .addEdge("feedback_agent", END);

  return graph.compile();
}

// Export pre-built compiled graphs for use in API routes
export const eduAgentGraph = buildEduAgentGraph();
export const planGraph = buildPlanGraph();
export const testGraph = buildTestGraph();
export const feedbackGraph = buildFeedbackGraph();
