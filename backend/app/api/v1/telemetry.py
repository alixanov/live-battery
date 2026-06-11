from fastapi import APIRouter, HTTPException, Query
from app.schemas.telemetry import TelemetryCreate, VehicleCreate
from app.services.telemetry_service import process_telemetry
from app.core.database import get_db
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("", status_code=201)
async def ingest_telemetry(payload: TelemetryCreate):
    data = payload.model_dump()
    if not data.get("timestamp"):
        data["timestamp"] = datetime.utcnow()
    prediction = await process_telemetry(data)
    return {
        "status": "processed",
        "vehicle_id": payload.vehicle_id,
        "soc": prediction["soc"],
        "soh": prediction["soh"],
        "rul_cycles": prediction["rul_cycles"],
    }


@router.get("/{vehicle_id}")
async def get_telemetry(
    vehicle_id: str,
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
):
    db = get_db()
    cursor = db.telemetry.find(
        {"vehicle_id": vehicle_id},
        sort=[("timestamp", -1)],
    ).skip(skip).limit(limit)

    docs = await cursor.to_list(length=limit)
    return {"vehicle_id": vehicle_id, "data": [_serialize(d) for d in docs], "count": len(docs)}
