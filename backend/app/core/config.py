from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "EVBIS - EV Battery Intelligence System"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    MONGODB_URL: str = "mongodb://mongo:OYcFWzUvjXfdtGVuLakKmZbYHzPCxEAO@trolley.proxy.rlwy.net:11955"
    DATABASE_NAME: str = "evbis"

    JWT_SECRET_KEY: str = "evbis-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    CORS_ORIGIN_REGEX: str = r"https://.*\.up\.railway\.app"

    # Alert thresholds
    SOC_OVERCHARGE_THRESHOLD: float = 95.0
    SOC_DEEP_DISCHARGE_THRESHOLD: float = 10.0
    TEMP_OVERHEAT_THRESHOLD: float = 45.0
    SOH_WARNING_THRESHOLD: float = 80.0
    SOH_CRITICAL_THRESHOLD: float = 60.0
    IR_MULTIPLIER_THRESHOLD: float = 1.5
    RUL_LOW_THRESHOLD: int = 100
    CELL_IMBALANCE_THRESHOLD: float = 50.0  # mV

    class Config:
        env_file = ".env"


settings = Settings()
