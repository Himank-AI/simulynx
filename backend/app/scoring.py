"""Deterministic scoring + prototype XGBoost-ready features.

Synthetic/curated prototype data only. Do not use for employment decisions.
"""

from .models import DecisionIn, OverallOut, SimulationOut
from .xgboost_model import predict_scores


def run_simulation(payload: DecisionIn) -> SimulationOut:
    days = payload.office_days
    t = days / 5
    curve = t**1.6

    flexibility = round(max(0, min(100, 96 - curve * 54)))
    collaboration = round(max(0, min(100, 58 + t * 30)))
    accessibility = round(max(0, min(100, 88 - t * 24)))
    adoption = round(max(0, min(100, 86 - curve * 25)))
    inclusion = round((flexibility + accessibility + (100 - t * 20)) / 3)
    retention = round(max(0, min(100, 18 + curve * 32)))

    ml = predict_scores(
        {
            "office_days": days,
            "flexibility_preference": 62,
            "accessibility_requirement": 22,
            "commute_burden": 55,
            "career_stage": 1,
        }
    )
    adoption = round(0.7 * adoption + 0.3 * ml["adoption_score"])

    finding = (
        "The simulation indicates stronger acceptance when collaboration requirements "
        "are combined with flexibility."
        if days <= 3
        else (
            "A five-day mandate raises simulated collaboration while opening inclusion "
            "gaps for accessibility-sensitive and flexibility-dependent groups."
        )
    )

    return SimulationOut(
        overall=OverallOut(
            inclusion=inclusion,
            adoption=adoption,
            accessibility=accessibility,
            retention_risk=retention,
            flexibility=flexibility,
            collaboration=collaboration,
            confidence="Medium",
        ),
        key_finding=finding,
        dataset_note="Prototype synthetic/curated labeled scenarios (n=2400).",
        model_note=(
            "LLM is used for reasoning and multi-agent interaction. "
            "Structured ML and deterministic scoring handle quantitative evaluation."
        ),
    )
