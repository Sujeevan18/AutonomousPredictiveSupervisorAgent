import './style.css'
import Chart from 'chart.js/auto'

document.querySelector('#app').innerHTML = `
<div class="dashboard">
  <h1>Digital Twin PPO Maintenance Dashboard</h1>

  <h2>System Architecture</h2>
  <div class="architecture">
    <div class="box">Component Outputs<br>(Risk, RUL, Anomaly)</div>
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

  <div id="alarmBox" class="alarm-box" style="display:none;">
    ⚠️ CRITICAL MACHINE CONDITION DETECTED
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
    <p><b>Decision Confidence:</b> <span id="confidence"></span></p>
  </div>

  <div id="gaugeSection" style="display:none;">
    <h2>SCADA-Style Live Health Gauges</h2>
    <div class="gauge-row">
      <div class="gauge-card">
        <canvas id="riskGauge" width="220" height="150"></canvas>
        <h3>Failure Risk</h3>
      </div>
      <div class="gauge-card">
        <canvas id="anomalyGauge" width="220" height="150"></canvas>
        <h3>Anomaly Score</h3>
      </div>
      <div class="gauge-card">
        <canvas id="rulGauge" width="220" height="150"></canvas>
        <h3>RUL Health</h3>
      </div>
    </div>
  </div>

  <div id="metricsBox" style="display:none;">
    <h2>Evaluation Metrics</h2>
    <div class="metrics-grid">
      <div class="metric-card"><h3>Failure Avoidance</h3><p id="failureAvoidance">-</p></div>
      <div class="metric-card"><h3>Maintenance Cost</h3><p id="maintenanceCost">-</p></div>
      <div class="metric-card"><h3>Downtime Penalty</h3><p id="downtimePenalty">-</p></div>
      <div class="metric-card"><h3>Reward Score</h3><p id="rewardScore">-</p></div>
    </div>
  </div>

  <div class="chart-box">
  <h2>Model Comparison: PPO vs DQN vs A2C</h2>
  <canvas id="modelComparisonChart"></canvas>
    </div>

  <div id="extraInsightBox" style="display:none;">
    <h2>Current Health Indicators</h2>

    <label>Failure Risk</label>
    <div class="bar"><div id="riskBar" class="bar-fill"></div></div>
    <p id="riskPercent">-</p>

    <label>Anomaly Score</label>
    <div class="bar"><div id="anomalyBar" class="bar-fill"></div></div>
    <p id="anomalyPercent">-</p>

    <label>RUL Health</label>
    <div class="bar"><div id="rulBar" class="bar-fill"></div></div>
    <p id="rulPercent">-</p>

    <h2>Reward Breakdown</h2>
    <div class="metrics-grid">
      <div class="metric-card"><h3>Failure Avoidance Contribution</h3><p id="rewardFailure">-</p></div>
      <div class="metric-card"><h3>Maintenance Cost Penalty</h3><p id="rewardMaintenance">-</p></div>
      <div class="metric-card"><h3>Downtime Penalty</h3><p id="rewardDowntime">-</p></div>
      <div class="metric-card"><h3>Final Reward</h3><p id="rewardFinal">-</p></div>
    </div>

    <h2>Action Meaning Table</h2>
    <table class="action-table">
      <tr><th>Action ID</th><th>Action</th><th>Meaning</th></tr>
      <tr><td>0</td><td>Continue Operation</td><td>Machine is healthy enough to continue.</td></tr>
      <tr><td>1</td><td>Increase Monitoring</td><td>Early degradation signs are detected.</td></tr>
      <tr><td>2</td><td>Schedule Inspection</td><td>Machine should be inspected soon.</td></tr>
      <tr><td>3</td><td>Preventive Maintenance</td><td>Maintenance is recommended before failure.</td></tr>
      <tr><td>4</td><td>Emergency Stop</td><td>Critical condition; stop operation to avoid failure.</td></tr>
    </table>

    <h2>Autonomy Mode</h2>
    <div class="info-card">
      <h3>Current Deployment Mode: Human-on-the-loop</h3>
      <p>
        The PPO agent can recommend actions autonomously, but in safety-critical maintenance,
        engineers should monitor and override decisions when required.
      </p>
    </div>

    <h2>Input Source</h2>
    <div class="info-card">
      <h3>Prototype Input: Simulated Agent Outputs</h3>
      <p>
        This prototype currently uses mock outputs for failure risk, RUL, uncertainty,
        and anomaly score. Later, this CSV can be replaced with final group ETL/model outputs.
      </p>
    </div>
  </div>

  <div class="chart-box">
    <h2>Engine Health Trend</h2>
    <canvas id="healthChart"></canvas>
  </div>

  <div class="chart-box">
    <h2>Predictive Future Degradation Timeline</h2>
    <canvas id="futureChart"></canvas>
  </div>
</div>
`

let autoInterval = null
let autoCycle = 1
let healthChart = null
let futureChart = null

function getStatus(data) {
  if (data.failure_risk >= 0.8 || data.anomaly_score >= 0.8 || data.predicted_rul <= 20) {
    return 'Critical ⚠️'
  }

  if (data.failure_risk >= 0.5 || data.anomaly_score >= 0.5 || data.predicted_rul <= 60) {
    return 'Warning ⚠️'
  }

  return 'Healthy ✅'
}

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

function drawNeedleGauge(canvasId, value, label) {
  const canvas = document.getElementById(canvasId)
  const ctx = canvas.getContext('2d')

  const width = canvas.width
  const height = canvas.height
  const cx = width / 2
  const cy = height - 25
  const radius = 85

  ctx.clearRect(0, 0, width, height)

  const startAngle = Math.PI
  const endAngle = 2 * Math.PI

  ctx.lineWidth = 18

  ctx.beginPath()
  ctx.strokeStyle = '#22c55e'
  ctx.arc(cx, cy, radius, Math.PI, Math.PI + Math.PI * 0.5)
  ctx.stroke()

  ctx.beginPath()
  ctx.strokeStyle = '#facc15'
  ctx.arc(cx, cy, radius, Math.PI + Math.PI * 0.5, Math.PI + Math.PI * 0.8)
  ctx.stroke()

  ctx.beginPath()
  ctx.strokeStyle = '#ef4444'
  ctx.arc(cx, cy, radius, Math.PI + Math.PI * 0.8, endAngle)
  ctx.stroke()

  const angle = startAngle + (value / 100) * Math.PI
  const needleLength = radius - 15

  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(
    cx + needleLength * Math.cos(angle),
    cy + needleLength * Math.sin(angle)
  )
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, 7, 0, 2 * Math.PI)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`${value}%`, cx, cy - 35)

  ctx.font = '13px Arial'
  ctx.fillText(label, cx, cy - 8)
}

function animateGauge(canvasId, targetValue, label) {
  let current = 0
  const interval = setInterval(() => {
    drawNeedleGauge(canvasId, current, label)

    if (current >= targetValue) {
      clearInterval(interval)
    }

    current += 2
    if (current > targetValue) current = targetValue
  }, 10)
}

function updateGauges(data) {
  document.querySelector('#gaugeSection').style.display = 'block'

  const risk = Math.round(data.failure_risk * 100)
  const anomaly = Math.round(data.anomaly_score * 100)
  const rulHealth = Math.max(0, Math.min(100, Math.round((data.predicted_rul / 200) * 100)))

  animateGauge('riskGauge', risk, 'Risk')
  animateGauge('anomalyGauge', anomaly, 'Anomaly')
  animateGauge('rulGauge', rulHealth, 'RUL')
}

function updateAlarm(data) {
  const alarmBox = document.querySelector('#alarmBox')
  const dashboard = document.querySelector('.dashboard')

  const isCritical =
    data.failure_risk >= 0.8 ||
    data.anomaly_score >= 0.8 ||
    data.predicted_rul <= 20 ||
    data.action_id === 4

  if (isCritical) {
    alarmBox.style.display = 'block'
    dashboard.classList.add('critical-flash')
  } else {
    alarmBox.style.display = 'none'
    dashboard.classList.remove('critical-flash')
  }
}

function updateFutureTimeline(data) {
  const currentCycle = data.cycle
  const currentRisk = data.failure_risk
  const currentAnomaly = data.anomaly_score
  const currentRul = data.predicted_rul

  const futureLabels = []
  const futureRisk = []
  const futureAnomaly = []
  const futureRul = []

  for (let i = 0; i <= 10; i++) {
    const futureCycle = currentCycle + i * 5
    futureLabels.push(futureCycle)

    futureRisk.push(Math.min(1, currentRisk + i * 0.035))
    futureAnomaly.push(Math.min(1, currentAnomaly + i * 0.03))
    futureRul.push(Math.max(0, (currentRul - i * 5) / 200))
  }

  if (futureChart) {
    futureChart.destroy()
  }

  futureChart = new Chart(document.getElementById('futureChart'), {
    type: 'line',
    data: {
      labels: futureLabels,
      datasets: [
        {
          label: 'Projected Failure Risk',
          data: futureRisk,
          borderColor: '#ef4444',
          backgroundColor: '#ef444455',
          borderWidth: 3,
          tension: 0.3
        },
        {
          label: 'Projected Anomaly',
          data: futureAnomaly,
          borderColor: '#f97316',
          backgroundColor: '#f9731655',
          borderWidth: 3,
          tension: 0.3
        },
        {
          label: 'Projected RUL Health',
          data: futureRul,
          borderColor: '#22c55e',
          backgroundColor: '#22c55e55',
          borderWidth: 3,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#ffffff' }
        },
        title: {
          display: true,
          text: 'Forecasted Machine Health for Next 50 Cycles',
          color: '#ffffff',
          font: { size: 18, weight: 'bold' }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Future Engine Cycle',
            color: '#ffffff',
            font: { size: 15, weight: 'bold' }
          },
          ticks: { color: '#ffffff' },
          grid: { color: '#374151' }
        },
        y: {
          min: 0,
          max: 1,
          title: {
            display: true,
            text: 'Projected Normalized Value',
            color: '#ffffff',
            font: { size: 15, weight: 'bold' }
          },
          ticks: { color: '#ffffff' },
          grid: { color: '#374151' }
        }
      }
    }
  })
}

function updateExtraInsights(data, metrics) {
  document.querySelector('#extraInsightBox').style.display = 'block'

  const riskPercent = Math.round(data.failure_risk * 100)
  const anomalyPercent = Math.round(data.anomaly_score * 100)
  const rulHealth = Math.max(0, Math.min(100, Math.round((data.predicted_rul / 200) * 100)))

  document.querySelector('#riskBar').style.width = `${riskPercent}%`
  document.querySelector('#anomalyBar').style.width = `${anomalyPercent}%`
  document.querySelector('#rulBar').style.width = `${rulHealth}%`

  document.querySelector('#riskPercent').textContent = `${riskPercent}%`
  document.querySelector('#anomalyPercent').textContent = `${anomalyPercent}%`
  document.querySelector('#rulPercent').textContent = `${rulHealth}%`

  document.querySelector('#rewardFailure').textContent = `+${metrics.failureAvoidance}`
  document.querySelector('#rewardMaintenance').textContent = `-${metrics.maintenanceCost}`
  document.querySelector('#rewardDowntime').textContent = `-${metrics.downtimePenalty}`
  document.querySelector('#rewardFinal').textContent = metrics.rewardScore
}

function animateArchitecture() {
  const boxes = document.querySelectorAll('.box')

  boxes.forEach(box => {
    box.style.boxShadow = 'none'
  })

  if (boxes.length >= 4) {
    boxes[0].style.boxShadow = '0 0 18px cyan'
    setTimeout(() => boxes[1].style.boxShadow = '0 0 18px yellow', 300)
    setTimeout(() => boxes[2].style.boxShadow = '0 0 18px orange', 600)
    setTimeout(() => boxes[3].style.boxShadow = '0 0 18px lime', 900)
  }
}

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

  const metrics = calculateMetrics(data)

  document.querySelector('#metricsBox').style.display = 'block'
  document.querySelector('#failureAvoidance').textContent = `${metrics.failureAvoidance}%`
  document.querySelector('#maintenanceCost').textContent = `${metrics.maintenanceCost}`
  document.querySelector('#downtimePenalty').textContent = `${metrics.downtimePenalty}`
  document.querySelector('#rewardScore').textContent = metrics.rewardScore

  animateArchitecture()
  updateExtraInsights(data, metrics)
  updateGauges(data)
  updateAlarm(data)
  updateFutureTimeline(data)

  let confidence = "Stable"

if (data.failure_risk > 0.7 || data.anomaly_score > 0.7) {
  confidence = "High Risk Decision ⚠️"
} else if (data.failure_risk > 0.4) {
  confidence = "Moderate Confidence"
} else {
  confidence = "Stable Decision"
}

document.querySelector('#confidence').textContent = confidence
}

async function getPrediction(cycle) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/predict/${cycle}`)
    const data = await res.json()
    updateUI(data)
  } catch (error) {
    alert('Failed to fetch prediction. Make sure backend is running.')
    console.error(error)
  }
}

async function loadModelComparisonChart() {
  try {
    const res = await fetch('http://127.0.0.1:8000/model-comparison')
    const data = await res.json()

    const labels = data.map(item => item.Model)
    const avgReward = data.map(item => item["Average Reward"])
    const failureAvoidance = data.map(item => item["Failure Avoidance %"])
    const wrongDecisions = data.map(item => item["Wrong Critical Decisions"])

    new Chart(document.getElementById('modelComparisonChart'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Average Reward',
            data: avgReward,
            borderWidth: 2
          },
          {
            label: 'Failure Avoidance %',
            data: failureAvoidance,
            borderWidth: 2
          },
          {
            label: 'Wrong Critical Decisions',
            data: wrongDecisions,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff',
              font: { size: 14, weight: 'bold' }
            }
          },
          title: {
            display: true,
            text: 'RL Model Performance Comparison',
            color: '#ffffff',
            font: { size: 18, weight: 'bold' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: '#374151' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#ffffff' },
            grid: { color: '#374151' }
          }
        }
      }
    })
  } catch (error) {
    console.error('Model comparison chart loading failed:', error)
  }
}

async function loadChart() {
  try {
    const res = await fetch('http://127.0.0.1:8000/history')
    const data = await res.json()

    const labels = data.map(d => d.cycle)
    const maxRul = Math.max(...data.map(d => d.predicted_rul))

    const failureRisk = data.map(d => d.failure_risk)
    const anomaly = data.map(d => d.anomaly_score)
    const normalizedRul = data.map(d => d.predicted_rul / maxRul)

    healthChart = new Chart(document.getElementById('healthChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Failure Risk',
            data: failureRisk,
            borderColor: '#60a5fa',
            backgroundColor: '#60a5fa55',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 3
          },
          {
            label: 'Anomaly Score',
            data: anomaly,
            borderColor: '#fb7185',
            backgroundColor: '#fb718555',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 3
          },
          {
            label: 'Normalized RUL',
            data: normalizedRul,
            borderColor: '#fbbf24',
            backgroundColor: '#fbbf2455',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff',
              font: { size: 15, weight: 'bold' }
            }
          },
          title: {
            display: true,
            text: 'Failure Risk, Anomaly Score and RUL Trend Over Engine Lifecycle',
            color: '#ffffff',
            font: { size: 18, weight: 'bold' }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Engine Cycle',
              color: '#ffffff',
              font: { size: 16, weight: 'bold' }
            },
            ticks: { color: '#ffffff', font: { size: 12 } },
            grid: { color: '#374151' }
          },
          y: {
            min: 0,
            max: 1,
            title: {
              display: true,
              text: 'Normalized Health Value',
              color: '#ffffff',
              font: { size: 16, weight: 'bold' }
            },
            ticks: { color: '#ffffff', font: { size: 12 } },
            grid: { color: '#374151' }
          }
        }
      }
    })
  } catch (error) {
    console.error('Chart loading failed:', error)
  }
}

document.querySelector('#predictBtn').onclick = () => {
  const cycle = document.querySelector('#cycleInput').value
  getPrediction(cycle)
}

document.querySelector('#autoBtn').onclick = () => {
  if (autoInterval) return

  autoInterval = setInterval(() => {
    document.querySelector('#cycleInput').value = autoCycle
    getPrediction(autoCycle)

    autoCycle += 5

    if (autoCycle > 200) {
      autoCycle = 1
    }
  }, 1000)
}

document.querySelector('#stopBtn').onclick = () => {
  clearInterval(autoInterval)
  autoInterval = null
}

loadChart()
loadModelComparisonChart()