from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PredictionResponse(BaseModel):
    id: str
    vehicle_id: str
    timestamp: datetime
    soc: float = Field(..., description="State of Charge %")
    soh: float = Field(..., description="State of Health %")
    internal_resistance: float = Field(..., description="Internal Resistance mOhm")
    rul_cycles: int = Field(..., description="Remaining Useful Life in cycles")
    rul_days: int = Field(..., description="Remaining Useful Life in days")
    confidence: float = Field(..., description="Prediction confidence 0-1")


class PredictionHistory(BaseModel):
    vehicle_id: str
    predictions: list[PredictionResponse]
    total: int
