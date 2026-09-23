"""Simulynx FastAPI service.

LLM layer is abstracted — this service never claims to train a language model.
Quantitative scores come from deterministic rules + a prototype XGBoost model
trained on synthetic/curated labeled scenarios.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import DecisionIn, HealthOut, SimulationOut
from .scoring import run_simulation

app = FastAPI(
    title="Simulynx Simulation Core",
    version="0.1.0",
    description="Workforce decision intelligence APIs for the Simulynx prototype.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    return HealthOut(
        status="ok",
        note="LLM for reasoning; XGBoost + deterministic scoring for numbers. Prototype dataset.",
    )


@app.post("/simulate", response_model=SimulationOut)
def simulate(payload: DecisionIn) -> SimulationOut:
    return run_simulation(payload)
