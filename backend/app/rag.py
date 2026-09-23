"""RAG-ready retrieval.

Chunk → embed → pgvector → retrieve. Prototype returns curated snippets
so the frontend can demo evidence without a live database.
"""

EVIDENCE = [
    {
        "source": "Northstar Hybrid Charter (prototype)",
        "chunk": "Presence is a coordination tool, not a proxy for performance.",
    },
    {
        "source": "Accessibility guidelines (prototype)",
        "chunk": "Remote work remains a reasonable adjustment where commute or environment creates a barrier.",
    },
    {
        "source": "Industry framework (prototype)",
        "chunk": "Validate simulated findings with a representative employee sample before implementation.",
    },
]


def retrieve(query: str, k: int = 3) -> list[dict]:
    _ = query
    return EVIDENCE[:k]
