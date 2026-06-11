from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class BatteryChemistry(str, Enum):
    LFP = "LFP"
    NMC = "NMC"
    NCA = "NCA"


class TelemetryCreate(BaseModel):
    vehicle_id: str
    timestamp: Optional[datetime] = None
    voltage: float = Field(..., ge=0, le=1000, description="Battery voltage in V")
    current: float = Field(..., description="Current in A (negative = discharge)")
    temperature: float = Field(..., ge=-40, le=100, description="Temperature in °C")
    capacity_nominal: float = Field(..., gt=0, description="Nominal capacity in Ah")
    capacity_measured: Optional[float] = Field(None, gt=0)
    cycle_count: int = Field(..., ge=0)
    cell_voltages: Optional[list[float]] = None


class TelemetryResponse(BaseModel):
    id: str
    vehicle_id: str
    timestamp: datetime
    voltage: float
    current: float
    temperature: float
    capacity_nominal: float
    capacity_measured: Optional[float]
    cycle_count: int


class VehicleCreate(BaseModel):
    vehicle_id: str
    make: str
    model: str
    year: int = Field(..., ge=2000, le=2030)
    battery_nominal_capacity: float = Field(..., gt=0)
    battery_chemistry: BatteryChemistry = BatteryChemistry.NMC


class VehicleResponse(BaseModel):
    id: str
    vehicle_id: str
    make: str
    model: str
    year: int
    battery_nominal_capacity: float
    battery_chemistry: str
    created_at: datetime
