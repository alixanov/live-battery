"""
State of Health estimator.
Uses capacity fade model + temperature stress + DoD stress.
"""
import numpy as np
import logging

logger = logging.getLogger(__name__)


class SoHEstimator:
    """
    SoH estimation combining:
    1. Capacity fade: SoH_cap = C_measured / C_nominal
    2. Cycle-based degradation model (Arrhenius + DoD correction)
    3. Temperature stress factor
    """

    # Arrhenius activation energy / gas constant pre-computed per chemistry
    _CHEM_PARAMS = {
        "NMC": {"k_cycle": 0.00015, "k_temp": 0.0008, "T_ref": 25.0},
        "LFP": {"k_cycle": 0.00008, "k_temp": 0.0005, "T_ref": 25.0},
        "NCA": {"k_cycle": 0.00020, "k_temp": 0.0010, "T_ref": 25.0},
    }

    @classmethod
    def estimate(
        cls,
        capacity_nominal: float,
        capacity_measured: float,
        cycle_count: int,
        temperature: float,
        dod: float = 0.8,
        chemistry: str = "NMC",
    ) -> float:
        """Returns SoH as percentage (0-100)."""

        # Direct capacity ratio
        soh_capacity = (capacity_measured / capacity_nominal) * 100.0 if capacity_measured else None

        # Model-based estimate
        params = cls._CHEM_PARAMS.get(chemistry, cls._CHEM_PARAMS["NMC"])
        k_c = params["k_cycle"]
        k_t = params["k_temp"]
        T_ref = params["T_ref"]

        # DoD stress: deeper discharge accelerates degradation
        dod_factor = 1.0 + 0.5 * (dod - 0.5) if dod > 0.5 else 1.0

        # Temperature stress (simplified Arrhenius)
        temp_delta = abs(temperature - T_ref)
        temp_factor = 1.0 + k_t * temp_delta

        fade_per_cycle = k_c * dod_factor * temp_factor
        soh_model = max(0.0, 100.0 - cycle_count * fade_per_cycle * 100.0)

        # Blend: if measured capacity available, weight it 70/30
        if soh_capacity is not None:
            soh = 0.7 * soh_capacity + 0.3 * soh_model
        else:
            soh = soh_model

        return float(np.clip(soh, 0.0, 100.0))

    @classmethod
    def estimate_dod(cls, soc_start: float, soc_end: float) -> float:
        """Depth of Discharge for a single cycle."""
        return max(0.0, (soc_start - soc_end) / 100.0)
