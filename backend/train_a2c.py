from stable_baselines3 import A2C
from digital_twin_env import MaintenanceDigitalTwinEnv

env = MaintenanceDigitalTwinEnv("data/mock_agent_outputs.csv")

model = A2C("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=50000)

model.save("models/a2c_model")

print("A2C model trained and saved successfully.")