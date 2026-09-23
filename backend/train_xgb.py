"""Train a tiny prototype XGBoost model on synthetic labeled scenarios.

    python -m backend.train_xgb

This is structured ML, not LLM training.
"""

from pathlib import Path

import numpy as np

try:
    import xgboost as xgb
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install xgboost to train the prototype model.") from exc


def synthetic_dataset(n: int = 2400, seed: int = 7):
    rng = np.random.default_rng(seed)
    office_days = rng.integers(0, 6, size=n)
    flex = rng.integers(20, 100, size=n)
    a11y = rng.integers(0, 100, size=n)
    commute = rng.integers(10, 100, size=n)
    career = rng.integers(0, 3, size=n)
    x = np.column_stack([office_days, flex, a11y, commute, career]).astype(float)
    intensity = office_days / 5
    adoption = 90 - flex * intensity * 0.35 - a11y * intensity * 0.2 - commute * intensity * 0.12
    risk = 18 + flex * intensity * 0.22 + a11y * intensity * 0.28 + commute * intensity * 0.14
    impact = 72 - np.abs(3 - office_days) * 5 + career * 2
    y = np.column_stack([impact, adoption, risk])
    return x, y


def main() -> None:
    x, y = synthetic_dataset()
    model = xgb.XGBRegressor(
        n_estimators=80,
        max_depth=3,
        learning_rate=0.08,
        subsample=0.9,
        objective="reg:squarederror",
    )
    model.fit(x, y)
    out = Path(__file__).resolve().parent / "data" / "model.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    model.save_model(out)
    print(f"Wrote prototype model to {out}")


if __name__ == "__main__":
    main()
