"""
State of Charge estimator using Extended Kalman Filter (EKF).
Battery model: equivalent circuit (R0 + R1||C1)
"""
import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class BatteryEKF:
    """
    Extended Kalman Filter for SoC estimation.
    State vector: [SoC, V_RC] where V_RC = voltage across RC pair
    """

    def __init__(self, capacity_ah: float = 100.0, chemistry: str = "NMC"):
        self.capacity = capacity_ah * 3600  # convert to As (Coulombs)
        self.chemistry = chemistry

        # EKF state: [SoC, V_RC]
        self.x = np.array([1.0, 0.0])  # initial state: fully charged
        self.P = np.diag([0.01, 0.01])  # initial covariance

        # Process noise
        self.Q = np.diag([1e-6, 1e-4])

        # Measurement noise
        self.R = np.array([[1e-3]])

        # Circuit parameters (NMC defaults)
        self.R0 = 0.01   # Ohm - internal resistance
        self.R1 = 0.005  # Ohm - RC pair resistance
        self.C1 = 2000   # F   - RC pair capacitance
        self.tau = self.R1 * self.C1

        self._set_chemistry_params(chemistry)

    def _set_chemistry_params(self, chemistry: str):
        if chemistry == "LFP":
            self.R0 = 0.008
            self.R1 = 0.003
            self.V_max = 3.65
            self.V_min = 2.50
        elif chemistry == "NCA":
            self.R0 = 0.012
            self.R1 = 0.006
            self.V_max = 4.20
            self.V_min = 2.80
        else:  # NMC default
            self.V_max = 4.20
            self.V_min = 2.75

    def ocv(self, soc: float) -> float:
        """Open circuit voltage lookup — polynomial fit from empirical data."""
        soc = np.clip(soc, 0.0, 1.0)
        if self.chemistry == "LFP":
            # LFP has very flat OCV curve
            coeffs = [0.2, 0.1, 0.05, 3.2]
        else:
            # NMC/NCA — more pronounced S-curve
            coeffs = [0.8, -1.5, 1.2, 0.3, 3.6]
        return float(np.polyval(coeffs, soc))

    def docv_dsoc(self, soc: float) -> float:
        """Derivative of OCV w.r.t. SoC — needed for linearization."""
        eps = 1e-4
        return (self.ocv(soc + eps) - self.ocv(soc - eps)) / (2 * eps)

    def predict(self, current: float, dt: float = 1.0):
        """EKF prediction step."""
        soc, v_rc = self.x

        # State transition
        soc_new = soc - (current * dt) / self.capacity
        alpha = np.exp(-dt / self.tau)
        v_rc_new = alpha * v_rc + self.R1 * (1 - alpha) * current

        self.x = np.array([np.clip(soc_new, 0.0, 1.0), v_rc_new])

        # Jacobian of state transition
        A = np.array([
            [1.0, 0.0],
            [0.0, alpha]
        ])

        self.P = A @ self.P @ A.T + self.Q

    def update(self, voltage_measured: float, current: float):
        """EKF update step with voltage measurement."""
        soc, v_rc = self.x

        # Predicted terminal voltage
        v_pred = self.ocv(soc) - v_rc - self.R0 * current

        # Jacobian of measurement model
        H = np.array([[self.docv_dsoc(soc), -1.0]])

        # Innovation
        y = voltage_measured - v_pred

        # Kalman gain
        S = H @ self.P @ H.T + self.R
        K = self.P @ H.T @ np.linalg.inv(S)

        # State update
        self.x = self.x + K.flatten() * y

        # Covariance update
        I = np.eye(2)
        self.P = (I - K @ H) @ self.P

        # Clamp SoC
        self.x[0] = np.clip(self.x[0], 0.0, 1.0)

    def estimate(self, voltage: float, current: float, dt: float = 1.0) -> float:
        """Full EKF cycle: predict + update. Returns SoC as percentage."""
        self.predict(current, dt)
        self.update(voltage, current)
        return float(self.x[0] * 100.0)


class SoCEstimator:
    """Vehicle-level SoC estimator with per-vehicle EKF instances."""

    _instances: dict[str, BatteryEKF] = {}

    @classmethod
    def get_or_create(cls, vehicle_id: str, capacity_ah: float, chemistry: str = "NMC") -> BatteryEKF:
        if vehicle_id not in cls._instances:
            cls._instances[vehicle_id] = BatteryEKF(capacity_ah, chemistry)
            logger.info(f"Created EKF for vehicle {vehicle_id}")
        return cls._instances[vehicle_id]

    @classmethod
    def estimate(
        cls,
        vehicle_id: str,
        voltage: float,
        current: float,
        capacity_ah: float,
        chemistry: str = "NMC",
        dt: float = 1.0,
    ) -> float:
        ekf = cls.get_or_create(vehicle_id, capacity_ah, chemistry)
        return ekf.estimate(voltage, current, dt)
