"""Prototype gradient-boosted scoring.

If xgboost is installed and backend/data/model.json exists, load it.
Otherwise use a transparent linear ensemble that matches the TypeScript port.
"""

from pathlib import Path
from typing import Any


def predict_scores(features: dict[str, Any]) -> dict[str, int]:
    days = float(features.get("office_days", 5))
    flex = float(features.get("flexibility_preference", 60))
    a11y = float(features.get("accessibility_requirement", 20))
    commute = float(features.get("commute_burden", 50))

    model_path = Path(__file__).resolve().parent.parent / "data" / "model.json"
    if model_path.exists():
        try:
            import xgboost as xgb  # type: ignore

            booster = xgb.Booster()
            booster.load_model(model_path)
            # Feature order must match train_xgb.py
            import numpy as np

            row = np.array([[days, flex, a11y, commute, float(features.get("career_stage", 1))]])
            pred = booster.predict(xgb.DMatrix(row))[0]
            return {
                "impact_score": int(max(0, min(100, pred[0]))),
                "adoption_score": int(max(0, min(100, pred[1]))),
                "risk_score": int(max(0, min(100, pred[2]))),
            }
        except Exception:
            pass

    intensity = days / 5
    adoption = 90 - flex * intensity * 0.35 - a11y * intensity * 0.2 - commute * intensity * 0.1
    risk = 20 + flex * intensity * 0.2 + a11y * intensity * 0.25 + commute * intensity * 0.15
    impact = 70 - abs(3 - days) * 4
    return {
        "impact_score": int(max(0, min(100, impact))),
        "adoption_score": int(max(0, min(100, adoption))),
        "risk_score": int(max(0, min(100, risk))),
    }
