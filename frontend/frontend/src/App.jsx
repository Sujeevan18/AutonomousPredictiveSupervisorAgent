import { useState } from "react";
import axios from "axios";

function App() {
  const [cycle, setCycle] = useState(50);
  const [result, setResult] = useState(null);

  const getPrediction = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/predict/${cycle}`
      );
      setResult(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>🚀 Digital Twin PPO Maintenance Dashboard</h1>

      <div style={{ marginBottom: "20px" }}>
        <label>Enter Engine Cycle: </label>
        <input
          type="number"
          value={cycle}
          onChange={(e) => setCycle(e.target.value)}
        />
        <button onClick={getPrediction} style={{ marginLeft: "10px" }}>
          Get Decision
        </button>
      </div>

      {result && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            maxWidth: "700px",
          }}
        >
          <h2>Maintenance Decision</h2>

          <p><b>Cycle:</b> {result.cycle}</p>
          <p><b>Failure Risk:</b> {result.failure_risk}</p>
          <p><b>Predicted RUL:</b> {result.predicted_rul}</p>
          <p><b>RUL Uncertainty:</b> {result.rul_uncertainty}</p>
          <p><b>Anomaly Score:</b> {result.anomaly_score}</p>

          <h3>Selected Action: {result.selected_action}</h3>

          <p><b>Explanation:</b> {result.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default App;