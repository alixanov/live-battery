"""
Internal resistance estimator via voltage pulse method.
IR = ΔV / ΔI during load transients.
"""
import numpy as np
import logging
from collections import deque
from typing import Optional

logger = logging.getLogger(__name__)


class ResistanceCalculator:
    """Per-vehicle internal resistance tracker using sliding window."""

    _buffers: dict[str, deque] = {}  # vehicle_id -> deque of (voltage, current)
    _ir_estimates: dict[str, float] = {}

    BASELINE_IR = {
        "NMC": 10.0,   # mOhm
        "LFP": 8.0,
        "NCA": 12.0,
    }

    @classmethod
    def update(
        cls,
        vehicle_id: str,
        voltage: float,
        current: float,
        chemistry: str = "NMC",
    ) -> float:
        """Update IR estimate and return current mOhm value."""
        if vehicle_id not in cls._buffers:
            cls._buffers[vehicle_id] = deque(maxlen=10)
            cls._ir_estimates[vehicle_id] = cls.BASELINE_IR.get(chemistry, 10.0)

        buf = cls._buffers[vehicle_id]
        buf.append((voltage, current))

        if len(buf) >= 4:
            voltages = np.array([b[0] for b in buf])
            currents = np.array([b[1] for b in buf])

            delta_v = np.diff(voltages)
            delta_i = np.diff(currents)

            # Only compute where current changed significantly
            mask = np.abs(delta_i) > 0.5
            if mask.any():
                ir_samples = np.abs(delta_v[mask] / delta_i[mask]) * 1000  # to mOhm
                ir_samples = ir_samples[(ir_samples > 0) & (ir_samples < 500)]
                if len(ir_samples) > 0:
                    # Exponential moving average
                    alpha = 0.3
                    new_ir = float(np.median(ir_samples))
                    cls._ir_estimates[vehicle_id] = (
                        alpha * new_ir + (1 - alpha) * cls._ir_estimates[vehicle_id]
                    )

        return cls._ir_estimates.get(vehicle_id, cls.BASELINE_IR.get(chemistry, 10.0))

    @classmethod
    def get_baseline(cls, chemistry: str = "NMC") -> float:
        return cls.BASELINE_IR.get(chemistry, 10.0)
