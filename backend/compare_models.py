import numpy as np
import pandas as pd
from stable_baselines3 import PPO, DQN, A2C
from digital_twin_env import MaintenanceDigitalTwinEnv

MODELS = {
    "PPO": PPO.load("models/ppo_maintenance_model"),
    "DQN": DQN.load("models/dqn_model"),
    "A2C": A2C.load("models/a2c_model"),
}

def evaluate_model(model, model_name):
    env = MaintenanceDigitalTwinEnv("data/mock_agent_outputs.csv")
    obs, _ = env.reset()

    total_reward = 0
    rewards = []
    actions = []
    failures_avoided = 0
    critical_cases = 0
    wrong_critical_decisions = 0

    done = False

    while not done:
        action, _ = model.predict(obs, deterministic=True)
        action = int(action)

        obs, reward, terminated, truncated, info = env.step(action)

        risk = info["risk"]
        rul = info["rul"]
        anomaly = info["anomaly"]

        total_reward += reward
        rewards.append(reward)
        actions.append(action)

        is_critical = risk > 0.7 or rul < 25 or anomaly > 0.7

        if is_critical:
            critical_cases += 1

            if action in [2, 3, 4]:
                failures_avoided += 1
            else:
                wrong_critical_decisions += 1

        done = terminated or truncated

    action_changes = sum(
        1 for i in range(1, len(actions)) if actions[i] != actions[i - 1]
    )

    failure_avoidance_rate = (
        failures_avoided / critical_cases * 100 if critical_cases > 0 else 0
    )

    return {
        "Model": model_name,
        "Total Reward": round(total_reward, 2),
        "Average Reward": round(np.mean(rewards), 2),
        "Failure Avoidance %": round(failure_avoidance_rate, 2),
        "Wrong Critical Decisions": wrong_critical_decisions,
        "Action Changes": action_changes
    }

results = []

for name, model in MODELS.items():
    results.append(evaluate_model(model, name))

df = pd.DataFrame(results)
print(df)

df.to_csv("model_comparison_results.csv", index=False)
print("\nSaved: model_comparison_results.csv")