from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        db = client[settings.DATABASE_NAME]
        await client.admin.command("ping")
        logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")
        await create_indexes()
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise


async def disconnect_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB disconnected")


async def create_indexes():
    await db.telemetry.create_index([("vehicle_id", 1), ("timestamp", -1)])
    await db.telemetry.create_index([("timestamp", 1)], expireAfterSeconds=60 * 60 * 24 * 90)
    await db.predictions.create_index([("vehicle_id", 1), ("timestamp", -1)])
    await db.alerts.create_index([("vehicle_id", 1), ("is_active", 1)])
    await db.alerts.create_index([("priority", 1)])
    await db.vehicles.create_index([("vehicle_id", 1)], unique=True)
    logger.info("MongoDB indexes created")


def get_db():
    return db
