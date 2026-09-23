from typing import Literal

from pydantic import BaseModel, Field


class DecisionIn(BaseModel):
    prompt: str
    office_days: int = Field(ge=0, le=5, default=5)
    category: str = "work-model"
    workforce_scope: str = "Entire workforce"


class OverallOut(BaseModel):
    inclusion: int
    adoption: int
    accessibility: int
    retention_risk: int
    flexibility: int
    collaboration: int
    confidence: Literal["Low", "Medium", "High"]


class SimulationOut(BaseModel):
    overall: OverallOut
    key_finding: str
    dataset_note: str
    model_note: str


class HealthOut(BaseModel):
    status: str
    note: str
