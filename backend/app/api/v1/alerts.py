from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/alerts", tags=["alerts"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("")
async def get_all_alerts(
    active_only: bool = Query(True),
    priority: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    db = get_db()
    query = {}
    if active_only:
        query["is_active"] = True
    if priority:
        query["priority"] = priority.upper()

    cursor = db.alerts.find(query, sort=[("triggered_at", -1)]).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_serialize(d) for d in docs]


@router.get("/{vehicle_id}")
async def get_vehicle_alerts(
    vehicle_id: str,
    active_only: bool = Query(True),
    limit: int = Query(50, ge=1, le=200),
):
    db = get_db()
    query = {"vehicle_id": vehicle_id}
    if active_only:
        query["is_active"] = True

    cursor = db.alerts.find(query, sort=[("triggered_at", -1)]).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_serialize(d) for d in docs]


@router.patch("/{alert_id}/resolve", status_code=200)
async def resolve_alert(alert_id: str):
    db = get_db()
    try:
        oid = ObjectId(alert_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid alert ID")

    result = await db.alerts.update_one(
        {"_id": oid, "is_active": True},
        {"$set": {"is_active": False, "resolved_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found or already resolved")
    return {"status": "resolved"}


@router.get("/stats/summary")
async def get_alert_stats():
    db = get_db()
    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
    ]
    cursor = db.alerts.aggregate(pipeline)
    results = await cursor.to_list(length=10)
    return {r["_id"]: r["count"] for r in results}
