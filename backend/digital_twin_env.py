import gymnasium as gym
from gymnasium import spaces
import numpy as np
import pandas as pd

class MaintenanceDigitalTwinEnv(gym.Env):
    def __init__(self, data_path="data/mock_agent_outputs.csv"):
        super().__init__()

        self.data = pd.read_csv(data_path)
        self.current_step = 0

        self.action_space = spaces.Discrete(5)

        self.observation_space = spaces.Box(
            low=0,
            high=1,
            shape=(5,),
            dtype=np.float32
        )

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_step = 0
        return self._get_state(), {}

    def _get_state(self):
        row = self.data.iloc[self.current_step]

        state = np.array([
            row["failure_risk"],
            row["predicted_rul"] / self.data["predicted_rul"].max(),
            row["rul_uncertainty"],
            row["anomaly_score"],
            row["cycle_ratio"]
        ], dtype=np.float32)

        return state

    def step(self, action):
        row = self.data.iloc[self.current_step]

        risk = row["failure_risk"]
        rul = row["predicted_rul"]
        anomaly = row["anomaly_score"]

        reward = self._calculate_reward(action, risk, rul, anomaly)

        self.current_step += 1

        terminated = self.current_step >= len(self.data) - 1
        truncated = False

        next_state = self._get_state()

        info = {
            "risk": float(risk),
            "rul": float(rul),
            "anomaly": float(anomaly),
            "action": int(action)
        }

        return next_state, reward, terminated, truncated, info

    def _calculate_reward(self, action, risk, rul, anomaly):
        reward = 0

        if action == 0:  # Continue
            reward += 5
            if risk > 0.7 or rul < 25:
                reward -= 50

        elif action == 1:  # Increase monitoring
            reward += 3
            reward -= 2

        elif action == 2:  # Inspection
            reward += 10 if risk > 0.5 else -5
            reward -= 8

        elif action == 3:  # Preventive maintenance
            reward += 25 if rul < 35 else -15
            reward -= 15

        elif action == 4:  # Emergency stop
            reward += 40 if risk > 0.85 else -35
            reward -= 25

        reward -= anomaly * 5

        return reward