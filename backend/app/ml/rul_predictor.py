"""
Remaining Useful Life predictor.
Uses linear degradation model + uncertainty estimation.
For production: replace with trained LSTM/Transformer.
"""
import numpy as np
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

EOL_THRESHOLD = 80.0  # SoH % at End of Life
CYCLES_PER_DAY_DEFAULT = 1.5


class RULPredictor:
    """
    RUL prediction via linear regression on SoH degradation slope.
    Maintains rolling SoH history per vehicle to fit degradation curve.
    """

    _history: dict[str, list[Tuple[int, float]]] = {}  # vehicle_id -> [(cycle, soh)]

    @classmethod
    def update_history(cls, vehicle_id: str, cycle: int, soh: float):
        if vehicle_id not in cls._history:
            cls._history[vehicle_id] = []
        cls._history[vehicle_id].append((cycle, soh))
        # Keep last 200 data points
        if len(cls._history[vehicle_id]) > 200:
            cls._history[vehicle_id] = cls._history[vehicle_id][-200:]

    @classmethod
    def predict(
        cls,
        vehicle_id: str,
        current_soh: float,
        current_cycle: int,
        cycles_per_day: float = CYCLES_PER_DAY_DEFAULT,
        chemistry: str = "NMC",
    ) -> Tuple[int, int, float]:
        """
        Returns: (rul_cycles, rul_days, confidence)
        """
        history = cls._history.get(vehicle_id, [])

        if len(history) >= 5:
            cycles = np.array([h[0] for h in history])
            sohs = np.array([h[1] for h in history])
            # Linear regression: SoH = a * cycle + b
            coeffs = np.polyfit(cycles, sohs, 1)
            slope = coeffs[0]  # degradation per cycle
        else:
            # Fallback: chemistry-based defaults
            defaults = {"NMC": -0.015, "LFP": -0.008, "NCA": -0.020}
            slope = defaults.get(chemistry, -0.015)

        # RUL = (current_soh - EOL_threshold) / |slope|
        if slope >= 0:
            rul_cycles = 9999
            confidence = 0.3
        else:
            rul_cycles = int((current_soh - EOL_THRESHOLD) / abs(slope))
            rul_cycles = max(0, rul_cycles)
            # Confidence based on history length
            confidence = min(0.95, 0.3 + len(history) * 0.003)

        rul_days = int(rul_cycles / max(cycles_per_day, 0.1))

        return rul_cycles, rul_days, round(confidence, 3)
