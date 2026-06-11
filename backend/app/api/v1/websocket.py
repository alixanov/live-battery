from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.alert_service import register_ws_broadcast
import asyncio
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])

# vehicle_id -> list of active WebSocket connections
_connections: dict[str, list[WebSocket]] = {}


async def broadcast(vehicle_id: str, payload: dict):
    """Send payload to all subscribers of a vehicle."""
    connections = _connections.get(vehicle_id, [])
    dead = []
    for ws in connections:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.remove(ws)


# Register broadcast callback for alert service
register_ws_broadcast(broadcast)


@router.websocket("/ws/live/{vehicle_id}")
async def vehicle_live_stream(websocket: WebSocket, vehicle_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected: {vehicle_id}")

    if vehicle_id not in _connections:
        _connections[vehicle_id] = []
    _connections[vehicle_id].append(websocket)

    try:
        while True:
            # Keep-alive ping every 30s
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {vehicle_id}")
        if vehicle_id in _connections:
            _connections[vehicle_id].remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error for {vehicle_id}: {e}")
        if vehicle_id in _connections and websocket in _connections[vehicle_id]:
            _connections[vehicle_id].remove(websocket)
