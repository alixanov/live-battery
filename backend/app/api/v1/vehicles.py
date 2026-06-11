from fastapi import APIRouter, HTTPException
from app.schemas.telemetry import VehicleCreate
from app.core.database import get_db
from datetime import datetime

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("", status_code=201)
async def create_vehicle(payload: VehicleCreate):
    db = get_db()
    existing = await db.vehicles.find_one({"vehicle_id": payload.vehicle_id})
    if existing:
        raise HTTPException(status_code=409, detail="Vehicle already exists")

    doc = {
        **payload.model_dump(),
        "created_at": datetime.utcnow(),
    }
    result = await db.vehicles.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.get("")
async def list_vehicles():
    db = get_db()
    cursor = db.vehicles.find({})
    docs = await cursor.to_list(length=500)
    return [_serialize(d) for d in docs]


@router.get("/{vehicle_id}")
async def get_vehicle(vehicle_id: str):
    db = get_db()
    doc = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return _serialize(doc)


@router.delete("/{vehicle_id}", status_code=204)
async def delete_vehicle(vehicle_id: str):
    db = get_db()
    result = await db.vehicles.delete_one({"vehicle_id": vehicle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
