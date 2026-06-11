from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/{vehicle_id}/latest")
async def get_latest_prediction(vehicle_id: str):
    db = get_db()
    doc = await db.predictions.find_one(
        {"vehicle_id": vehicle_id},
        sort=[("timestamp", -1)],
    )
    if not doc:
        raise HTTPException(status_code=404, detail="No predictions found")
    return _serialize(doc)


@router.get("/{vehicle_id}/history")
async def get_prediction_history(
    vehicle_id: str,
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
):
    db = get_db()
    cursor = db.predictions.find(
        {"vehicle_id": vehicle_id},
        sort=[("timestamp", -1)],
    ).skip(skip).limit(limit)

    docs = await cursor.to_list(length=limit)
    total = await db.predictions.count_documents({"vehicle_id": vehicle_id})
    return {
        "vehicle_id": vehicle_id,
        "predictions": [_serialize(d) for d in docs],
        "total": total,
    }
