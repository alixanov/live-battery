"""
Seed script — generates realistic battery telemetry for demo vehicles.
Run: python seed_data.py
"""
import asyncio
import random
import math
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb://mongo:OYcFWzUvjXfdtGVuLakKmZbYHzPCxEAO@trolley.proxy.rlwy.net:11955"
DB_NAME = "evbis"

VEHICLES = [
    {"vehicle_id": "EV-001", "make": "Tesla",     "model": "Model 3",  "year": 2022, "battery_nominal_capacity": 82.0, "battery_chemistry": "NMC"},
    {"vehicle_id": "EV-002", "make": "BYD",       "model": "Atto 3",   "year": 2023, "battery_nominal_capacity": 60.0, "battery_chemistry": "LFP"},
    {"vehicle_id": "EV-003", "make": "Hyundai",   "model": "Ioniq 6",  "year": 2023, "battery_nominal_capacity": 77.4, "battery_chemistry": "NMC"},
    {"vehicle_id": "EV-004", "make": "Rivian",    "model": "R1T",      "year": 2021, "battery_nominal_capacity": 135.0,"battery_chemistry": "NMC"},
    {"vehicle_id": "EV-005", "make": "Volkswagen","model": "ID.4",     "year": 2022, "battery_nominal_capacity": 77.0, "battery_chemistry": "NMC"},
]


def simulate_telemetry(vehicle: dict, t: datetime, cycle: int, soc_pct: float) -> dict:
    capacity = vehicle["battery_nominal_capacity"]
    chemistry = vehicle["battery_chemistry"]

    # Degradation
    degrade = 1.0 - cycle * 0.00015
    capacity_measured = capacity * degrade * random.uniform(0.98, 1.01)

    # Voltage model
    v_oc = 3.6 + (soc_pct / 100) * 0.8
    cells = int(capacity * 3600 / (v_oc * 100))
    cells = max(cells, 90)
    voltage = v_oc * cells * random.uniform(0.995, 1.005)

    # Current (charging = positive, discharging = negative)
    is_charging = soc_pct < 50
    current = random.uniform(20, 80) if is_charging else random.uniform(-100, -10)

    # Temperature
    temp_base = 25 + abs(current) * 0.05
    temperature = temp_base + random.uniform(-2, 3)

    # Cell imbalance
    cell_v = [v_oc + random.uniform(-0.005, 0.005) for _ in range(8)]

    return {
        "vehicle_id": vehicle["vehicle_id"],
        "timestamp": t,
        "voltage": round(voltage, 3),
        "current": round(current, 2),
        "temperature": round(temperature, 1),
        "capacity_nominal": capacity,
        "capacity_measured": round(capacity_measured, 2),
        "cycle_count": cycle,
        "cell_voltages": [round(v, 4) for v in cell_v],
    }


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    # Insert vehicles
    for v in VEHICLES:
        await db.vehicles.update_one(
            {"vehicle_id": v["vehicle_id"]},
            {"$setOnInsert": {**v, "created_at": datetime.utcnow()}},
            upsert=True,
        )
    print(f"Upserted {len(VEHICLES)} vehicles")

    # Insert telemetry — 24h of data per vehicle (every 5 min)
    now = datetime.utcnow()
    points = 288  # 24h * 60min / 5min

    for vehicle in VEHICLES:
        docs = []
        soc = random.uniform(60, 95)
        cycle = random.randint(50, 600)

        for i in range(points):
            t = now - timedelta(minutes=(points - i) * 5)
            docs.append(simulate_telemetry(vehicle, t, cycle, soc))

            # Update SoC
            delta = docs[-1]["current"] * 5 * 60 / (vehicle["battery_nominal_capacity"] * 3600) * 100
            soc = max(8, min(98, soc + delta * 0.1))
            if i % 50 == 0:
                cycle += 1

        await db.telemetry.insert_many(docs)
        print(f"  {vehicle['vehicle_id']}: {len(docs)} telemetry points")

    print("\nSeed complete!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
