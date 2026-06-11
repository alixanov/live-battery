from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class AlertType(str, Enum):
    OVERCHARGE = "OVERCHARGE"
    DEEP_DISCHARGE = "DEEP_DISCHARGE"
    OVERHEAT = "OVERHEAT"
    SOH_WARNING = "SOH_WARNING"
    SOH_CRITICAL = "SOH_CRITICAL"
    HIGH_RESISTANCE = "HIGH_RESISTANCE"
    RUL_LOW = "RUL_LOW"
    CELL_IMBALANCE = "CELL_IMBALANCE"


class AlertPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertResponse(BaseModel):
    id: str
    vehicle_id: str
    alert_type: AlertType
    priority: AlertPriority
    message: str
    value: float
    threshold: float
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    is_active: bool


class AlertResolve(BaseModel):
    resolved_at: Optional[datetime] = None
