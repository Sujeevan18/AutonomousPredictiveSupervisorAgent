from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from stable_baselines3 import PPO
import pandas as pd
import numpy as np
import shutil
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = PPO.load("models/ppo_maintenance_model")

DEFAULT_DATA_PATH = "data/mock_agent_outputs.csv"
df = pd.read_csv(DEFAULT_DATA_PATH)

ACTION_MAP = {
    0: "Continue Operation",
    1: "Increase Monitoring",
    2: "Schedule Inspection",
    3: "Preventive Maintenance",
    4: "Emergency Stop"
}

REQUIRED_COLUMNS = [
    "cycle",
    "failure_risk",
    "predicted_rul",
    "rul_uncertainty",
    "anomaly_score",
    "cycle_ratio"
]

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

def predict_from_row(row):
    max_rul = df["predicted_rul"].max()
    if max_rul == 0:
        max_rul = 1

    state = np.array([
        row["failure_risk"],
        row["predicted_rul"] / max_rul,
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
        "cycle_ratio": round(float(row["cycle_ratio"]), 3),
        "selected_action": ACTION_MAP[action],
        "action_id": action,
        "explanation": explain_decision(
            action,
            row["failure_risk"],
            row["predicted_rul"],
            row["anomaly_score"]
        )
    }

@app.get("/")
def home():
    return {
        "message": "Digital Twin PPO Maintenance API running",
        "active_rows": len(df)
    }

@app.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    global df

    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    uploaded_df = pd.read_csv(file_path)

    missing = [col for col in REQUIRED_COLUMNS if col not in uploaded_df.columns]

    if missing:
        return {
            "status": "error",
            "message": f"Missing required columns: {missing}"
        }

    df = uploaded_df.copy()

    return {
        "status": "success",
        "message": "New dataset uploaded and activated successfully",
        "rows": len(df),
        "columns": list(df.columns)
    }

@app.get("/predict/{index}")
def predict(index: int):
    if index < 0:
        index = 0

    if index >= len(df):
        index = len(df) - 1

    row = df.iloc[index]
    return predict_from_row(row)

@app.get("/history")
def history():
    sample = df.head(100).copy()
    return sample.to_dict(orient="records")

@app.get("/model-comparison")
def get_model_comparison():
    comparison_df = pd.read_csv("model_comparison_results.csv")
    return comparison_df.to_dict(orient="records")

@app.post("/reset-dataset")
def reset_dataset():
    global df
    df = pd.read_csv(DEFAULT_DATA_PATH)

    return {
        "status": "success",
        "message": "Dataset reset to default mock_agent_outputs.csv",
        "rows": len(df)
    }