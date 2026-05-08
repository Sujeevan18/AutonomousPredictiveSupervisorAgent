from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from stable_baselines3 import PPO
import pandas as pd
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = PPO.load("models/ppo_maintenance_model")
df = pd.read_csv("data/mock_agent_outputs.csv")

ACTION_MAP = {
    0: "Continue Operation",
    1: "Increase Monitoring",
    2: "Schedule Inspection",
    3: "Preventive Maintenance",
    4: "Emergency Stop"
}

def explain_decision(action, risk, rul, anomaly):
    if action == 0:
        return "The PPO agent selected continue operation because the current health condition is still acceptable."
    elif action == 1:
        return "The PPO agent selected increased monitoring due to early signs of degradation."
    elif action == 2:
        return "The PPO agent selected inspection because the failure risk is becoming noticeable."
    elif action == 3:
        return "The PPO agent selected preventive maintenance because RUL is low and failure risk is high."
    elif action == 4:
        return "The PPO agent selected emergency stop because the machine condition is critically unsafe."

@app.get("/")
def home():
    return {"message": "Digital Twin PPO Maintenance API running"}

@app.get("/predict/{cycle}")
def predict(cycle: int):
    if cycle >= len(df):
        cycle = len(df) - 1

    row = df.iloc[cycle]

    state = np.array([
        row["failure_risk"],
        row["predicted_rul"] / df["predicted_rul"].max(),
        row["rul_uncertainty"],
        row["anomaly_score"],
        row["cycle_ratio"]
    ], dtype=np.float32)

    action, _ = model.predict(state, deterministic=True)
    action = int(action)

    return {
        "cycle": int(row["cycle"]),
        "failure_risk": round(float(row["failure_risk"]), 3),
        "predicted_rul": round(float(row["predicted_rul"]), 2),
        "rul_uncertainty": round(float(row["rul_uncertainty"]), 3),
        "anomaly_score": round(float(row["anomaly_score"]), 3),
        "selected_action": ACTION_MAP[action],
        "action_id": action,
        "explanation": explain_decision(
            action,
            row["failure_risk"],
            row["predicted_rul"],
            row["anomaly_score"]
        )
    }

@app.get("/history")
def history():
    sample = df.head(100).copy()
    return sample.to_dict(orient="records")

@app.get("/model-comparison")
def get_model_comparison():
    df = pd.read_csv("model_comparison_results.csv")
    return df.to_dict(orient="records")