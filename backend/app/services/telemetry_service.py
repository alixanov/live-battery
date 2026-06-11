from datetime import datetime
from app.core.database import get_db
from app.services.prediction_service import run_prediction
from app.services.alert_service import check_and_fire_alerts
import logging

logger = logging.getLogger(__name__)


async def process_telemetry(payload: dict) -> dict:
    """Ingest telemetry, run ML pipeline, fire alerts."""
    db = get_db()

    vehicle_id = payload["vehicle_id"]

    # Fetch vehicle config
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        # Auto-register unknown vehicle with defaults
        vehicle = {
            "vehicle_id": vehicle_id,
            "make": "Unknown",
            "model": "Unknown",
            "year": 2024,
            "battery_nominal_capacity": payload.get("capacity_nominal", 100.0),
            "battery_chemistry": "NMC",
            "created_at": datetime.utcnow(),
        }
        await db.vehicles.insert_one(vehicle)
        logger.info(f"Auto-registered vehicle: {vehicle_id}")

    # Persist raw telemetry
    telemetry_doc = {**payload, "timestamp": payload.get("timestamp") or datetime.utcnow()}
    result = await db.telemetry.insert_one(telemetry_doc)
    telemetry_doc["_id"] = result.inserted_id

    # Run ML predictions
    prediction = await run_prediction(telemetry_doc, vehicle)

    # Check alert rules
    await check_and_fire_alerts(vehicle_id, prediction, telemetry_doc, vehicle)

    return prediction
