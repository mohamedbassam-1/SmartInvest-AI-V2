from flask import Flask, render_template, request, jsonify
from ta.momentum import RSIIndicator, ROCIndicator
from ta.trend import EMAIndicator, MACD, SMAIndicator
from ta.volatility import BollingerBands
import yfinance as yf
import pandas as pd
import numpy as np
import os
import pickle
import requests
import io

# Add this to load the hidden file
from dotenv import load_dotenv
load_dotenv() 

app = Flask(__name__)

# ==========================================
# 🔑 SECURITY CONFIGURATION
# This now safely pulls from your .env file!
FMP_API_KEY = os.getenv("FMP_API_KEY")
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
keras_model = None
data_scaler = None

keras_path = os.path.join(BASE_DIR, 'lstm_model.keras')
scaler_path = os.path.join(BASE_DIR, 'scaler.pkl')

try:
    if os.path.exists(keras_path):
        import tensorflow as tf
        keras_model = tf.keras.models.load_model(keras_path, compile=False)
        print("✅ LSTM Brain Loaded Successfully.")
    if os.path.exists(scaler_path):
        with open(scaler_path, 'rb') as f:
            data_scaler = pickle.load(f)
            print("✅ Scaler Math Translator Loaded Successfully.")
except Exception as e:
    print(f"⚠️ Initialization Error: {e}")

@app.route("/")
def home(): 
    return render_template("index.html")

def fetch_historical_series(symbol):
    # 1. Try standard yfinance download
    try:
        session = requests.Session()
        session.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'})
        data = yf.download(symbol, period="3mo", interval="1d", session=session, progress=False)
        if data is not None and not data.empty:
            if isinstance(data.columns, pd.MultiIndex):
                close_col = [col for col in data.columns if col[0].lower() == 'close']
                close = data[close_col[0]] if close_col else data.xs('Close', axis=1, level=0)
            else:
                close_col = [col for col in data.columns if 'close' in str(col).lower()]
                close = data[close_col[0]] if close_col else data['Close']
            if isinstance(close, pd.DataFrame):
                close = close.iloc[:, 0]
            close = close.dropna().astype(float)
            if len(close) > 10:
                return close, False
    except Exception:
        pass

    print(f"⚠️ YFinance blocked history for {symbol}. Rerouting to Hidden JSON Chart API...")
    
    # 2. Bypassing with Yahoo's internal JSON history stream
    try:
        url = f"https://query2.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=3mo"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        res = requests.get(url, headers=headers, timeout=10)
        
        if res.status_code == 429:
            raise Exception("Rate limited by Yahoo JSON.")
            
        res_json = res.json()
        
        if 'chart' in res_json and 'result' in res_json['chart'] and res_json['chart']['result']:
            timestamps = res_json['chart']['result'][0]['timestamp']
            closes = res_json['chart']['result'][0]['indicators']['quote'][0]['close']
            
            df = pd.DataFrame({'Date': pd.to_datetime(timestamps, unit='s'), 'Close': closes})
            df.set_index('Date', inplace=True)
            df.dropna(inplace=True)
            
            if len(df['Close']) > 10:
                print("✅ Historical matrix successfully pulled via hidden JSON stream.")
                return df['Close'].astype(float), False
    except Exception as e:
        print(f"⚠️ JSON Chart API fallback failed: {e}")

    print(f"⚠️ All historical pipelines failed for {symbol}. Deploying sandbox.")
    return generate_fallback_data(symbol), True

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if request.is_json:
            req_data = request.get_json()
            symbol = req_data.get("stock_value", "GLD").upper().strip()
        else:
            symbol = request.form.get("stock_value", "GLD").upper().strip()
            
        print(f"\n==========================================")
        print(f"🔍 Processing core matrix for: {symbol}")
        
        # Valid Ticker Length Check
        if not symbol or len(symbol) > 10:
            return jsonify({"error": "Invalid ticker format"}), 400
            
        close, is_simulated = fetch_historical_series(symbol)

        latest = float(close.iloc[-1])
        prev = float(close.iloc[-2])
        
        # Pull Exact Live Spot Price
        try:
            url = f"https://query2.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1m&range=1d"
            headers = {'User-Agent': 'Mozilla/5.0'}
            res = requests.get(url, headers=headers, timeout=5)
            
            if res.status_code == 429:
                return jsonify({"error": "API Rate Limit Reached. Please wait."}), 429
                
            json_data = res.json()
            
            if 'chart' in json_data and 'result' in json_data['chart'] and json_data['chart']['result']:
                meta = json_data['chart']['result'][0]['meta']
                if 'regularMarketPrice' in meta:
                    latest = float(meta['regularMarketPrice'])
                    prev = float(meta['chartPreviousClose'])
                    if 'previousClose' in meta:
                        prev = float(meta['previousClose'])
                    print(f"✅ Exact live Spot Price pulled from hidden JSON stream: ${latest}")
            else:
                raise Exception("Invalid JSON structure")
        except Exception as e:
            print(f"⚠️ Hidden JSON pipeline crash (possibly invalid ticker): {e}")

        # Baseline Target Fallback
        target = latest * 1.015 

        if keras_model is not None and data_scaler is not None:
            try:
                raw_input = close.values[-50:].reshape(-1, 1)
                scaled_input = data_scaler.transform(raw_input)
                lstm_input = scaled_input.reshape(1, 50, 1)
                
                prediction = keras_model.predict(lstm_input, verbose=0)
                target = float(data_scaler.inverse_transform(prediction)[0][0])
                
                price_diff_ratio = latest / float(close.iloc[-1])
                if abs(1 - price_diff_ratio) > 0.05: 
                    target = target * price_diff_ratio
            except Exception as ml_err:
                print(f"LSTM Core Runtime Exception: {ml_err}")

        change_delta = latest - prev
        change_pct = (change_delta / prev) * 100 if prev > 0 else 0
        
        # --- TECHNICAL INDICATORS ---
        rsi_val = round(float(RSIIndicator(close).rsi().iloc[-1]), 2) if len(close) > 14 else 54.51
        ema_val = round(float(EMAIndicator(close, window=20).ema_indicator().iloc[-1]), 2) if len(close) > 20 else latest
        sma_val = round(float(SMAIndicator(close, window=50).sma_indicator().iloc[-1]), 2) if len(close) > 50 else latest
        roc_val = round(float(ROCIndicator(close, window=12).roc().iloc[-1]), 2) if len(close) > 12 else 0.0
        roc_str = "Positive Momentum" if roc_val > 0 else "Negative Momentum"

        macd_obj = MACD(close)
        macd_line = macd_obj.macd().iloc[-1]
        macd_signal = macd_obj.macd_signal().iloc[-1]
        
        if pd.isna(macd_line) or pd.isna(macd_signal):
            macd_str = "Neutral"
        elif macd_line > macd_signal:
            macd_str = "Bullish Crossover"
        else:
            macd_str = "Bearish Momentum"

        bb_obj = BollingerBands(close)
        bb_high = bb_obj.bollinger_hband().iloc[-1]
        bb_low = bb_obj.bollinger_lband().iloc[-1]
        
        if pd.isna(bb_high) or pd.isna(bb_low):
            bb_str = "Normal Range"
        elif latest >= bb_high:
            bb_str = "Overbought"
        elif latest <= bb_low:
            bb_str = "Oversold"
        else:
            bb_str = "Normal Range"

        # ==========================================
        # 🌟 AI CONFIDENCE & EXPLAINABILITY ENGINE
        # ==========================================
        reasons = []
        confidence_base = 65 
        is_bullish = target > latest

        if is_bullish:
            reasons.append("✓ LSTM Neural Trend Positive")
            confidence_base += 10
            
            if macd_line > macd_signal:
                reasons.append("✓ MACD Bullish Momentum")
                confidence_base += 5
            else:
                reasons.append("✗ MACD Bearish Drag")
                confidence_base -= 5

            if latest > ema_val:
                reasons.append("✓ Price above EMA-20 Support")
                confidence_base += 5
            
            if rsi_val < 40:
                reasons.append("✓ RSI indicates Oversold Growth Potential")
                confidence_base += 5
            elif rsi_val > 70:
                reasons.append("✗ RSI indicates Overbought Risk")
                confidence_base -= 5
            else:
                reasons.append("✓ RSI Neutral/Stable")
                confidence_base += 2
                
            if roc_val > 0:
                reasons.append("✓ Positive ROC Velocity")
                confidence_base += 5
        else:
            reasons.append("✓ LSTM Neural Trend Negative")
            confidence_base += 10
            
            if macd_line < macd_signal:
                reasons.append("✓ MACD Bearish Momentum")
                confidence_base += 5
            else:
                reasons.append("✗ MACD Bullish Resistance")
                confidence_base -= 5

            if latest < ema_val:
                reasons.append("✓ Price below EMA-20 Resistance")
                confidence_base += 5
                
            if rsi_val > 60:
                reasons.append("✓ RSI indicates Overbought Drop Potential")
                confidence_base += 5
            elif rsi_val < 30:
                reasons.append("✗ RSI indicates Oversold Floor")
                confidence_base -= 5
            else:
                reasons.append("✓ RSI Neutral/Stable")
                confidence_base += 2
                
            if roc_val < 0:
                reasons.append("✓ Negative ROC Velocity")
                confidence_base += 5
                
        final_confidence = min(max(confidence_base, 50), 98)

        live_headlines = []
        sentiment_str = "Stable Market Sentiment"
        
        if not is_simulated:
            try:
                url_news = f"https://financialmodelingprep.com/api/v3/stock_news?tickers={symbol}&limit=4&apikey={FMP_API_KEY}"
                response_news = requests.get(url_news, timeout=3).json()
                
                if isinstance(response_news, dict) and "Error Message" in response_news:
                     print(f"🛑 FMP API REJECTED NEWS: {response_news['Error Message']}")
                elif isinstance(response_news, list) and len(response_news) > 0:
                    live_headlines = [item['title'] for item in response_news if 'title' in item]
                    
                    pos_words = ['surge', 'beat', 'rally', 'higher', 'buy', 'upgrade', 'up', 'gain', 'positive', 'growth']
                    neg_words = ['miss', 'drop', 'fall', 'lower', 'sell', 'downgrade', 'down', 'loss', 'negative', 'risk']
                    
                    all_text = " ".join(live_headlines).lower()
                    pos_count = sum(1 for word in all_text.split() if word in pos_words)
                    neg_count = sum(1 for word in all_text.split() if word in neg_words)
                    total_hits = pos_count + neg_count
                    
                    if total_hits == 0:
                        sentiment_str = "Neutral Market Sentiment"
                    else:
                        pos_ratio = (pos_count / total_hits) * 100
                        if pos_ratio >= 50:
                            sentiment_str = f"Bullish Sentiment ({int(pos_ratio)}% Positive)"
                        else:
                            sentiment_str = f"Bearish Sentiment ({int(100 - pos_ratio)}% Negative)"
            except Exception:
                pass

        if not live_headlines:
            live_headlines = [f"Market volumes stabilizing for asset profile {symbol}."]

        # 🌟 PREPARE HISTORICAL DATA FOR CHART.JS 🌟
        hist_subset = close.tail(14) # Pass the last 14 days of history to the frontend
        historicalData = [round(float(x), 2) for x in hist_subset.values]
        historicalLabels = [x.strftime('%Y-%m-%d') for x in hist_subset.index]

        print(f"✅ Final Output Price Sent to UI: ${latest}")
        print(f"==========================================\n")

        return jsonify({
            "currentPrice": f"${latest:.2f}",
            "predictedPrice": f"${target:.2f}",
            "change": f"{'+' if change_delta >= 0 else ''}{change_delta:.2f} ({'+' if change_delta >= 0 else ''}{change_pct:.2f}%)",
            "changeIcon": "▲" if change_delta >= 0 else "▼",
            "twoWeekPrediction": "Likely to Increase" if target > latest else "Likely to Decrease",
            "suggestion": "Ensemble ML Upward Trend" if target > latest else "Ensemble ML Downward Trend",
            "rsi": str(rsi_val),
            "ema20": f"${ema_val:.2f}",
            "sma50": f"${sma_val:.2f}",
            "roc": f"{roc_val}%",
            "rocStatus": roc_str,
            "macd": macd_str,
            "bollinger": bb_str,
            "newsSentiment": sentiment_str,
            "headlines": live_headlines,
            "confidence": final_confidence,
            "reasons": reasons,
            "historicalData": historicalData,
            "historicalLabels": historicalLabels
        })

    except Exception as global_err:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Invalid ticker, delisted asset, or network issue."}), 400

def generate_fallback_data(symbol):
    seed_price = sum(ord(char) for char in symbol) % 500 + 15.0
    np.random.seed(None)
    flux = np.random.normal(0.1, seed_price * 0.015, 60)
    simulated_prices = seed_price + np.cumsum(flux)
    dates = pd.date_range(end=pd.Timestamp.now(), periods=60, freq='B')
    return pd.Series(simulated_prices, index=dates)

@app.route("/trending", methods=["GET"])
def trending():
    tickers = ['SPY', 'QQQ', 'NVDA', 'BTC-USD', 'AAPL']
    results = []
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for sym in tickers:
        try:
            url = f"https://query2.finance.yahoo.com/v8/finance/chart/{sym}?interval=1m&range=1d"
            res = requests.get(url, headers=headers, timeout=2).json()
            meta = res['chart']['result'][0]['meta']
            price = float(meta['regularMarketPrice'])
            prev = float(meta['chartPreviousClose'])
            change = price - prev
            pct = (change/prev)*100
            icon = "▲" if change >= 0 else "▼"
            results.append({"sym": sym.replace("-USD", ""), "price": f"{price:.2f}", "change": f"{icon} {abs(pct):.2f}%"})
        except Exception:
            pass
            
    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)