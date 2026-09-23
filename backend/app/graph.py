"""LangGraph-shaped simulation graph (prototype).

Nodes: interpret → score → converse → red_team → report
The LLM is called only inside converse/red_team/report explanation nodes.
"""

from typing import TypedDict


class GraphState(TypedDict):
    prompt: str
    office_days: int
    scores: dict
    risks: list
    explanation: str


def interpret(state: GraphState) -> GraphState:
    return state


def score(state: GraphState) -> GraphState:
    return state


def red_team(state: GraphState) -> GraphState:
    return state


def compile_graph():
    """Return a callable that mirrors LangGraph node order."""

    def run(state: GraphState) -> GraphState:
        return red_team(score(interpret(state)))

    return run
