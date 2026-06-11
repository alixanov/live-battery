from datetime import datetime
from app.core.config import settings
from app.core.database import get_db
from app.schemas.alert import AlertType, AlertPriority
import logging
import asyncio
from typing import Callable, Any

logger = logging.getLogger(__name__)

# WebSocket broadcast callback — registered by websocket router
_ws_broadcast: Callable[[str, Any], None] | None = None


def register_ws_broadcast(callback: Callable):
    global _ws_broadcast
    _ws_broadcast = callback


async def check_and_fire_alerts(vehicle_id: str, prediction: dict, telemetry: dict, vehicle: dict):
    """Evaluate all alert rules and persist/broadcast any that trigger."""
    triggered = []

    chemistry = vehicle.get("battery_chemistry", "NMC")
    baseline_ir = 10.0  # mOhm baseline by chemistry
    ir_baselines = {"NMC": 10.0, "LFP": 8.0, "NCA": 12.0}
    ir_baseline = ir_baselines.get(chemistry, 10.0)

    rules = [
        (
            prediction["soc"] > settings.SOC_OVERCHARGE_THRESHOLD,
            AlertType.OVERCHARGE, AlertPriority.HIGH,
            f"SoC {prediction['soc']:.1f}% exceeds overcharge threshold",
            prediction["soc"], settings.SOC_OVERCHARGE_THRESHOLD,
        ),
        (
            prediction["soc"] < settings.SOC_DEEP_DISCHARGE_THRESHOLD,
            AlertType.DEEP_DISCHARGE, AlertPriority.CRITICAL,
            f"SoC {prediction['soc']:.1f}% — deep discharge detected",
            prediction["soc"], settings.SOC_DEEP_DISCHARGE_THRESHOLD,
        ),
        (
            telemetry["temperature"] > settings.TEMP_OVERHEAT_THRESHOLD,
            AlertType.OVERHEAT, AlertPriority.CRITICAL,
            f"Temperature {telemetry['temperature']:.1f}°C exceeds safe limit",
            telemetry["temperature"], settings.TEMP_OVERHEAT_THRESHOLD,
        ),
        (
            settings.SOH_CRITICAL_THRESHOLD < prediction["soh"] <= settings.SOH_WARNING_THRESHOLD,
            AlertType.SOH_WARNING, AlertPriority.HIGH,
            f"Battery health {prediction['soh']:.1f}% — replacement recommended soon",
            prediction["soh"], settings.SOH_WARNING_THRESHOLD,
        ),
        (
            prediction["soh"] <= settings.SOH_CRITICAL_THRESHOLD,
            AlertType.SOH_CRITICAL, AlertPriority.CRITICAL,
            f"Battery health {prediction['soh']:.1f}% — critical degradation",
            prediction["soh"], settings.SOH_CRITICAL_THRESHOLD,
        ),
        (
            prediction["internal_resistance"] > ir_baseline * settings.IR_MULTIPLIER_THRESHOLD,
            AlertType.HIGH_RESISTANCE, AlertPriority.MEDIUM,
            f"Internal resistance {prediction['internal_resistance']:.1f}mΩ elevated",
            prediction["internal_resistance"], ir_baseline * settings.IR_MULTIPLIER_THRESHOLD,
        ),
        (
            prediction["rul_cycles"] < settings.RUL_LOW_THRESHOLD,
            AlertType.RUL_LOW, AlertPriority.HIGH,
            f"Only {prediction['rul_cycles']} cycles remaining before EOL",
            float(prediction["rul_cycles"]), float(settings.RUL_LOW_THRESHOLD),
        ),
    ]

    # Cell imbalance check
    cell_voltages = telemetry.get("cell_voltages")
    if cell_voltages and len(cell_voltages) > 1:
        imbalance = (max(cell_voltages) - min(cell_voltages)) * 1000  # to mV
        if imbalance > settings.CELL_IMBALANCE_THRESHOLD:
            rules.append((
                True,
                AlertType.CELL_IMBALANCE, AlertPriority.MEDIUM,
                f"Cell voltage imbalance {imbalance:.1f}mV detected",
                imbalance, settings.CELL_IMBALANCE_THRESHOLD,
            ))

    db = get_db()

    for condition, alert_type, priority, message, value, threshold in rules:
        if not condition:
            continue

        # Dedup: skip if same alert already active
        existing = await db.alerts.find_one({
            "vehicle_id": vehicle_id,
            "alert_type": alert_type.value,
            "is_active": True,
        })
        if existing:
            continue

        alert_doc = {
            "vehicle_id": vehicle_id,
            "alert_type": alert_type.value,
            "priority": priority.value,
            "message": message,
            "value": value,
            "threshold": threshold,
            "triggered_at": datetime.utcnow(),
            "resolved_at": None,
            "is_active": True,
        }

        result = await db.alerts.insert_one(alert_doc)
        alert_doc["_id"] = result.inserted_id
        triggered.append(alert_doc)
        logger.warning(f"[ALERT] {vehicle_id} | {alert_type.value} | {message}")

    # Broadcast via WebSocket
    if triggered and _ws_broadcast:
        for alert in triggered:
            await _ws_broadcast(vehicle_id, {
                "type": "alert",
                "data": {
                    "alert_type": alert["alert_type"],
                    "priority": alert["priority"],
                    "message": alert["message"],
                    "value": alert["value"],
                }
            })

    return triggered
