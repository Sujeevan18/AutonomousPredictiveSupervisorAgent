from stable_baselines3 import DQN
from digital_twin_env import MaintenanceDigitalTwinEnv

env = MaintenanceDigitalTwinEnv("data/mock_agent_outputs.csv")

model = DQN("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=50000)

model.save("models/dqn_model")

print("DQN model trained and saved successfully.")