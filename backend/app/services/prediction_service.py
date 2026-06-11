from datetime import datetime
from app.ml.soc_estimator import SoCEstimator
from app.ml.soh_estimator import SoHEstimator
from app.ml.rul_predictor import RULPredictor
from app.ml.resistance_calc import ResistanceCalculator
from app.core.database import get_db
import logging

logger = logging.getLogger(__name__)


async def run_prediction(telemetry: dict, vehicle: dict) -> dict:
    """
    Run full prediction pipeline for a telemetry event.
    Returns prediction dict ready to save to MongoDB.
    """
    chemistry = vehicle.get("battery_chemistry", "NMC")
    capacity = vehicle.get("battery_nominal_capacity", 100.0)
    vehicle_id = telemetry["vehicle_id"]

    # 1. SoC via EKF
    soc = SoCEstimator.estimate(
        vehicle_id=vehicle_id,
        voltage=telemetry["voltage"],
        current=telemetry["current"],
        capacity_ah=capacity,
        chemistry=chemistry,
    )

    # 2. SoH via capacity fade model
    soh = SoHEstimator.estimate(
        capacity_nominal=capacity,
        capacity_measured=telemetry.get("capacity_measured"),
        cycle_count=telemetry.get("cycle_count", 0),
        temperature=telemetry["temperature"],
        chemistry=chemistry,
    )

    # 3. Internal resistance
    ir = ResistanceCalculator.update(
        vehicle_id=vehicle_id,
        voltage=telemetry["voltage"],
        current=telemetry["current"],
        chemistry=chemistry,
    )

    # 4. RUL
    RULPredictor.update_history(vehicle_id, telemetry.get("cycle_count", 0), soh)
    rul_cycles, rul_days, confidence = RULPredictor.predict(
        vehicle_id=vehicle_id,
        current_soh=soh,
        current_cycle=telemetry.get("cycle_count", 0),
        chemistry=chemistry,
    )

    prediction = {
        "vehicle_id": vehicle_id,
        "timestamp": datetime.utcnow(),
        "soc": round(soc, 2),
        "soh": round(soh, 2),
        "internal_resistance": round(ir, 3),
        "rul_cycles": rul_cycles,
        "rul_days": rul_days,
        "confidence": confidence,
    }

    db = get_db()
    result = await db.predictions.insert_one(prediction)
    prediction["_id"] = result.inserted_id

    return prediction
