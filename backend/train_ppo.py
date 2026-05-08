from stable_baselines3 import PPO
from digital_twin_env import MaintenanceDigitalTwinEnv

env = MaintenanceDigitalTwinEnv()

model = PPO(
    "MlpPolicy",
    env,
    learning_rate=0.0003,
    n_steps=1024,
    batch_size=64,
    gamma=0.99,
    verbose=1
)

model.learn(total_timesteps=100000)

model.save("models/ppo_maintenance_model")

print("PPO model trained and saved successfully.")