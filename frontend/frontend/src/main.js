import './style.css'
import Chart from 'chart.js/auto'

document.querySelector('#app').innerHTML = `
  <div class="dashboard">
    <h1>Digital Twin PPO Maintenance Dashboard</h1>
 
    <h2>System Architecture</h2>

    <div class="architecture">
      <div class="box">Agent Outputs<br>(Risk, RUL, Anomaly)</div>
      <div class="arrow">➡️</div>
      <div class="box">Digital Twin<br>(Simulation Environment)</div>
      <div class="arrow">➡️</div>
      <div class="box">PPO Supervisor<br>(Decision Agent)</div>
      <div class="arrow">➡️</div>
      <div class="box">Maintenance Action<br>(Decision + Explanation)</div>
    </div>

    <p>
      This prototype uses a Digital Twin environment and PPO Reinforcement Learning
      model to recommend maintenance actions.
    </p>

    <div class="input-box">
      <label>Enter Engine Cycle:</label>
      <input type="number" id="cycleInput" value="50" min="1" max="200" />
      <button id="predictBtn">Get Decision</button>
      <button id="autoBtn">Start Auto Simulation</button>
      <button id="stopBtn">Stop Simulation</button>
    </div>

    <div id="resultBox" style="display:none;">
      <h2>Maintenance Decision</h2>

      <h2 id="systemStatus">System Status: -</h2>

      <p><b>Cycle:</b> <span id="cycle"></span></p>
      <p><b>Failure Risk:</b> <span id="failureRisk"></span></p>
      <p><b>Predicted RUL:</b> <span id="predictedRul"></span></p>
      <p><b>RUL Uncertainty:</b> <span id="rulUncertainty"></span></p>
      <p><b>Anomaly Score:</b> <span id="anomalyScore"></span></p>

      <h3>Selected Action: <span id="selectedAction"></span></h3>
      <p><b>Explanation:</b> <span id="explanation"></span></p>
    </div>

    <div id="metricsBox" style="display:none;">
      <h2>Evaluation Metrics</h2>

      <div class="metrics-grid">
        <div class="metric-card">
          <h3>Failure Avoidance</h3>
          <p id="failureAvoidance">-</p>
        </div>

        <div class="metric-card">
          <h3>Maintenance Cost</h3>
          <p id="maintenanceCost">-</p>
        </div>

        <div class="metric-card">
          <h3>Downtime Penalty</h3>
          <p id="downtimePenalty">-</p>
        </div>

        <div class="metric-card">
          <h3>Reward Score</h3>
          <p id="rewardScore">-</p>
        </div>
      </div>
    </div>

    <div class="chart-box">
      <h2>Engine Health Trend</h2>
      <canvas id="healthChart"></canvas>
    </div>
  </div>
`

let autoInterval = null
let autoCycle = 1
let healthChart = null

// 🔹 STATUS FUNCTION
function getStatus(data) {
  if (data.failure_risk >= 0.8 || data.anomaly_score >= 0.8 || data.predicted_rul <= 20)
    return 'Critical ⚠️'

  if (data.failure_risk >= 0.5 || data.anomaly_score >= 0.5 || data.predicted_rul <= 60)
    return 'Warning ⚠️'

  return 'Healthy ✅'
}

// 🔹 METRICS FUNCTION
function calculateMetrics(data) {
  let failureAvoidance = 0
  let maintenanceCost = 0
  let downtimePenalty = 0
  let rewardScore = 0

  const risk = data.failure_risk
  const rul = data.predicted_rul
  const anomaly = data.anomaly_score
  const action = data.action_id

  if (action === 0) {
    maintenanceCost = 0
    downtimePenalty = 0
    failureAvoidance = risk < 0.5 ? 80 : 30
    rewardScore = risk < 0.5 ? 20 : -30
  }

  if (action === 1) {
    maintenanceCost = 10
    downtimePenalty = 5
    failureAvoidance = 60
    rewardScore = 15
  }

  if (action === 2) {
    maintenanceCost = 25
    downtimePenalty = 15
    failureAvoidance = risk > 0.5 ? 75 : 45
    rewardScore = risk > 0.5 ? 25 : -5
  }

  if (action === 3) {
    maintenanceCost = 50
    downtimePenalty = 30
    failureAvoidance = risk > 0.6 || rul < 50 ? 90 : 50
    rewardScore = risk > 0.6 || rul < 50 ? 40 : -15
  }

  if (action === 4) {
    maintenanceCost = 80
    downtimePenalty = 70
    failureAvoidance = risk > 0.8 || anomaly > 0.8 ? 95 : 30
    rewardScore = risk > 0.8 || anomaly > 0.8 ? 30 : -40
  }

  return { failureAvoidance, maintenanceCost, downtimePenalty, rewardScore }
}

// 🔹 UPDATE UI
function updateUI(data) {
  document.querySelector('#resultBox').style.display = 'block'

  document.querySelector('#cycle').textContent = data.cycle
  document.querySelector('#failureRisk').textContent = data.failure_risk
  document.querySelector('#predictedRul').textContent = data.predicted_rul
  document.querySelector('#rulUncertainty').textContent = data.rul_uncertainty
  document.querySelector('#anomalyScore').textContent = data.anomaly_score
  document.querySelector('#selectedAction').textContent = data.selected_action
  document.querySelector('#explanation').textContent = data.explanation

  document.querySelector('#systemStatus').textContent =
    `System Status: ${getStatus(data)}`

  // 🔥 Architecture Animation
  const boxes = document.querySelectorAll('.box')
  boxes.forEach(box => {
    box.style.border = "1px solid #888"
    box.style.boxShadow = "none"
  })

  if (boxes.length >= 4) {
    boxes[0].style.border = "2px solid cyan"
    setTimeout(() => boxes[1].style.border = "2px solid yellow", 300)
    setTimeout(() => boxes[2].style.border = "2px solid orange", 600)
    setTimeout(() => boxes[3].style.border = "2px solid lime", 900)
  }

  // 🔥 Metrics Update
  const metrics = calculateMetrics(data)
  document.querySelector('#metricsBox').style.display = 'block'

  document.querySelector('#failureAvoidance').textContent = `${metrics.failureAvoidance}%`
  document.querySelector('#maintenanceCost').textContent = `${metrics.maintenanceCost}`
  document.querySelector('#downtimePenalty').textContent = `${metrics.downtimePenalty}`
  document.querySelector('#rewardScore').textContent = metrics.rewardScore
}

// 🔹 API CALL
async function getPrediction(cycle) {
  const res = await fetch(`http://127.0.0.1:8000/predict/${cycle}`)
  const data = await res.json()
  updateUI(data)
}

// 🔹 CHART
async function loadChart() {
  const res = await fetch('http://127.0.0.1:8000/history')
  const data = await res.json()

  const labels = data.map(d => d.cycle)

  new Chart(document.getElementById('healthChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Failure Risk', data: data.map(d => d.failure_risk) },
        { label: 'Anomaly', data: data.map(d => d.anomaly_score) }
      ]
    }
  })
}

// 🔹 BUTTONS
document.querySelector('#predictBtn').onclick = () => {
  const cycle = document.querySelector('#cycleInput').value
  getPrediction(cycle)
}

document.querySelector('#autoBtn').onclick = () => {
  if (autoInterval) return
  autoInterval = setInterval(() => {
    getPrediction(autoCycle)
    autoCycle += 5
    if (autoCycle > 200) autoCycle = 1
  }, 1000)
}

document.querySelector('#stopBtn').onclick = () => {
  clearInterval(autoInterval)
  autoInterval = null
}

// INIT
loadChart()