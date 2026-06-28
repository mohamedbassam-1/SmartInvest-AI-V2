🚀 SmartInvest AI V2

An AI-powered stock market prediction platform combining LSTM neural networks with technical analysis.

📌 Overview

SmartInvest AI V2 is an end-to-end Artificial Intelligence web application developed as a Final Year Graduation Project.

The system collects real-time market data, analyzes historical stock prices, calculates multiple technical indicators, and generates AI-powered forecasts using a trained Long Short-Term Memory (LSTM) neural network.

Unlike traditional stock dashboards, SmartInvest AI focuses on Explainable AI (XAI) by combining machine learning with standard technical analysis to help users understand exactly why a prediction was made.

✨ Features

📈 Real-Time Data: Live market scraping and historical price visualization.

🤖 Deep Learning Engine: Powered by an LSTM neural network optimized for time-series forecasting.

🎯 AI Confidence Score: Dynamic conviction scoring based on algorithmic consensus.

🧠 Explainable Reasoning: Plain-English breakdown of market momentum.

📌 Technical Indicators: Calculates RSI, EMA, SMA, ROC, MACD, and Bollinger Bands.

📉 Trajectory Charting: Interactive Chart.js integration for visual forecasting.

⚡ Fast & Responsive: Built on a lightweight Flask backend with a premium, mobile-responsive "Neon-Ice" UI.

🛠 Tech Stack

Backend Architecture:

Python (Core Logic)

Flask (API & Web Server)

TensorFlow / Keras (LSTM Deep Learning)

Pandas & NumPy (Data Matrix Manipulation)

yfinance & TA-Lib / ta (Data Ingestion & Feature Engineering)

Frontend Interface:

HTML5 & CSS3 (Custom 3D Cybernetic UI)

JavaScript (Vanilla DOM Manipulation)

Chart.js (Dynamic Vector Visualization)

🏗 Project Architecture

User
 │
 ▼
Frontend (HTML / CSS / JavaScript)
 │
 ▼
Flask API
 │
 ▼
Market Data Ingestion (Yahoo Finance / JSON Streams)
 │
 ▼
Feature Engineering (RSI • EMA • SMA • MACD • ROC)
 │
 ▼
LSTM Neural Network (Sequence Processing)
 │
 ▼
Prediction Engine & Confidence Scoring
 │
 ▼
Dashboard Visualization (Chart.js & Reasoning Matrix)


📊 Dashboard

(Upload your screenshots to your GitHub repository and replace the links below to display them here!)

Landing Page: ![Landing Page][placeholder_link_here](https://github.com/mohamedbassam-1/SmartInvest-AI-V2/blob/main/Landing%20Page.png)

Prediction Dashboard: ![Dashboard]([placeholder_link_here](https://github.com/mohamedbassam-1/SmartInvest-AI-V2/blob/main/Photo%201.png)

Explainable AI Matrix: ![AI Reasoning]([placeholder_link_here](https://github.com/mohamedbassam-1/SmartInvest-AI-V2/blob/main/Photo%202.png)

Examples: ![Chart]([placeholder_link_here](https://github.com/mohamedbassam-1/SmartInvest-AI-V2/blob/main/Photo%203.png)
Examples: ![Chart]([placeholder_link_here](https://github.com/mohamedbassam-1/SmartInvest-AI-V2/blob/main/Photo%204.png)

⚙️ Installation & Quick Start

# 1. Clone the repository
git clone [https://github.com/mohamedbassam-1/SmartInvest-AI-V2.git](https://github.com/mohamedbassam-1/SmartInvest-AI-V2.git)

# 2. Enter the directory
cd SmartInvest-AI-V2

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the application
python app.py


Visit http://127.0.0.1:5000 in your browser to access the dashboard.

📈 Prediction Workflow

User enters a stock ticker (e.g., TSLA, QQQ).

Historical market data is securely downloaded via API fallbacks.

Technical indicators are calculated in real-time.

Data is normalized using a pre-trained MinMaxScaler.

The LSTM network predicts future price trajectories.

The AI generates a dynamic confidence score based on indicator consensus.

The UI renders the final prediction, reasoning matrix, and interactive chart.

🎯 Example Prediction Output

Metric

Value

Asset

QQQ

Current Price

$706.52

Predicted Target

$624.80

Confidence Score

87%

Trajectory

Bearish / Downward Trend

RSI (14)

50.08

EMA (20)

$720.53

📂 Project Structure

SmartInvest-AI-V2/
│
├── app.py                 # Main Flask application & API routes
├── requirements.txt       # Python dependencies
├── lstm_model.keras       # Trained Neural Network weights
├── scaler.pkl             # MinMaxScaler for data normalization
├── .env                   # Secure API keys (Not tracked)
├── .gitignore             # Git exclusion rules
│
├── static/                
│   ├── styles.css         # Neon-Ice UI styling & animations
│   └── script.js          # Frontend logic & Chart.js rendering
│
└── templates/             
    └── index.html         # Main HTML dashboard structure


🚀 Future Improvements (Roadmap)

[ ] Transformer-based forecasting models (Attention Mechanisms).

[ ] Multi-stock portfolio analysis and batch predictions.

[ ] Real-time WebSockets for tick-by-tick price updates.

[ ] Deeper integration of Macroeconomic indicators.

[ ] Multi-day trajectory forecasting capability.

[ ] Cloud deployment (AWS / Render).

⚠️ Disclaimer

This project was developed strictly for educational and academic research purposes. The predictions, sentiment analysis, and confidence scores generated by SmartInvest AI should not be considered financial advice or investment recommendations. Always conduct your own due diligence before engaging in financial markets.
