import pandas as pd
import numpy as np

num_cycles = 200

data = []

for cycle in range(1, num_cycles + 1):
    cycle_ratio = cycle / num_cycles

    # Simulate realistic degradation
    failure_risk = np.clip(cycle_ratio + np.random.normal(0, 0.03), 0, 1)
    predicted_rul = num_cycles - cycle
    rul_uncertainty = np.clip(1 - cycle_ratio + np.random.normal(0, 0.05), 0, 1)
    anomaly_score = np.clip(failure_risk + np.random.normal(0, 0.05), 0, 1)

    data.append([
        1,  # engine_id
        cycle,
        failure_risk,
        predicted_rul,
        rul_uncertainty,
        anomaly_score
    ])

df = pd.DataFrame(data, columns=[
    "engine_id",
    "cycle",
    "failure_risk",
    "predicted_rul",
    "rul_uncertainty",
    "anomaly_score"
])

df["cycle_ratio"] = df["cycle"] / df["cycle"].max()

df.to_csv("data/mock_agent_outputs.csv", index=False)

print("Mock dataset generated successfully!")