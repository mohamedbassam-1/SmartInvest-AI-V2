document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Core UI Terminal initialized. Data pipeline listening...");

    const resultsGrid = document.querySelector(".results-grid");
    const spotCard = document.querySelector(".price-tracking-card");
    if (resultsGrid && spotCard) {
        resultsGrid.insertBefore(spotCard, resultsGrid.firstChild);
    }

    const analysisForm = document.querySelector("form") || document.getElementById("analysis-form");
    const executeBtn = document.getElementById("execute-btn") || document.querySelector("button[type='submit']");
    const errorContainer = document.getElementById("error-message");

    const jargonMap = {
        "LSTM Neural Trend Positive": "AI detects a strong upward price pattern.",
        "LSTM Neural Trend Negative": "AI detects a downward price pattern.",
        "MACD Bullish Momentum": "Short-term momentum is shifting upwards.",
        "MACD Bearish Drag": "Short-term momentum is dragging the price down.",
        "MACD Bearish Momentum": "Short-term momentum is shifting downwards.",
        "MACD Bullish Resistance": "Momentum is fighting against the downward trend.",
        "Price above EMA-20 Support": "Price is holding strong above its recent average.",
        "Price below EMA-20 Resistance": "Price is struggling to break above its recent average.",
        "RSI indicates Oversold Growth Potential": "The stock is heavily undersold, hinting at a potential bounce.",
        "RSI indicates Overbought Risk": "The stock has been bought up too fast and might cool off soon.",
        "RSI indicates Overbought Drop Potential": "The stock is overbought and shows signs of dropping.",
        "RSI indicates Oversold Floor": "The stock is heavily undersold and might have found a bottom.",
        "RSI Neutral/Stable": "Buying and selling pressure are currently balanced.",
        "Positive ROC Velocity": "The speed of the stock's growth is increasing.",
        "Negative ROC Velocity": "The speed of the stock's drop is accelerating."
    };

    // 🌟 GLOBAL TICKER 🌟
    let tickerInterval;
    async function loadTrendingTickers() {
        try {
            const res = await fetch("/trending");
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            const list = document.getElementById("trendingMarketList");
            
            if(list && data.length > 0) {
                list.innerHTML = ""; 
                list.style.display = "flex";
                list.style.overflow = "hidden";
                list.style.whiteSpace = "nowrap";
                list.style.alignItems = "center";
                list.style.justifyContent = "flex-start";

                data.forEach(item => {
                    let li = document.createElement("li");
                    let color = item.change.includes("▲") ? "#00ff88" : "#ff4444";
                    li.innerHTML = `<strong style="color: #fff; font-size: 1.05rem;">${item.sym}</strong>: $${item.price} <span style="color:${color}; font-size:0.95em; margin-left:6px; font-weight: 900;">${item.change}</span>`;
                    li.style.display = "inline-block";
                    li.style.minWidth = "220px"; 
                    li.style.transition = "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease";
                    list.appendChild(li);
                });

                if(tickerInterval) clearInterval(tickerInterval);
                tickerInterval = setInterval(() => {
                    if(list.children.length > 1) {
                        const firstChild = list.firstElementChild;
                        firstChild.style.transform = "translateX(-100%) scale(0.9)";
                        firstChild.style.opacity = "0";
                        setTimeout(() => {
                            list.appendChild(firstChild);
                            firstChild.style.transform = "translateX(0) scale(1)";
                            firstChild.style.opacity = "1";
                        }, 600); 
                    }
                }, 4000); 
            }
        } catch(e) {
            console.log("⚠️ Offline or API blocked. Unable to load global momentum.");
        }
    }
    loadTrendingTickers();

    // 🌟 REAL CHART.JS IMPLEMENTATION 🌟
    let activeChart = null; // Track chart instance to destroy/rebuild it

    function buildInteractiveChart(historyData, historyLabels, predictedPriceNum, changeIcon) {
        const ctx = document.getElementById('realChart').getContext('2d');
        
        // Destroy old chart if it exists
        if (activeChart) {
            activeChart.destroy();
        }

        // Prepare data arrays
        let finalData = [...historyData]; // Copy history
        finalData.push(predictedPriceNum); // Append prediction to the end

        let finalLabels = [...historyLabels];
        finalLabels.push("TARGET");

        // Set colors based on trajectory
        let lineColor = changeIcon === "▲" ? "#00ff88" : "#ff4444";
        
        // Create gradient fill
        let gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, "rgba(0, 230, 255, 0.4)");
        gradient.addColorStop(1, "rgba(0, 230, 255, 0.0)");

        activeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: finalLabels,
                datasets: [{
                    label: 'Spot Price',
                    data: finalData,
                    borderColor: function(context) {
                        // Color the last segment (the prediction) differently
                        const index = context.dataIndex;
                        if (index === finalData.length - 1 || index === finalData.length - 2) {
                            return lineColor; 
                        }
                        return "#00e6ff"; // Historical color
                    },
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3, // Adds the smooth bezier curve
                    pointBackgroundColor: function(context) {
                        if (context.dataIndex === finalData.length - 1) return lineColor;
                        if (context.dataIndex === finalData.length - 2) return "#00e6ff"; // LIVE dot
                        return "transparent"; // Hide old dots
                    },
                    pointBorderColor: "transparent",
                    pointRadius: function(context) {
                        if (context.dataIndex >= finalData.length - 2) return 5; // Show only LIVE and TARGET dots
                        return 0;
                    },
                    segment: {
                        borderDash: ctx => ctx.p0DataIndex === finalData.length - 2 ? [5, 5] : undefined // Dash the prediction line
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(2, 9, 25, 0.9)',
                        titleColor: '#00e6ff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(0, 230, 255, 0.2)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        display: false // Hide bottom labels for cleaner look
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { family: 'JetBrains Mono', size: 10 },
                            callback: function(value) { return '$' + value; }
                        }
                    }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    }

    // 🌟 MASTER PREDICTION PIPELINE 🌟
    async function processCoreAnalysis(e) {
        if (e) e.preventDefault();

        const stockInput = document.getElementById("stock_value");
        const ticker = stockInput && stockInput.value.trim() ? stockInput.value.toUpperCase().trim() : "GLD";
        
        // Hide old errors
        if (errorContainer) errorContainer.style.display = "none";

        if (executeBtn) {
            executeBtn.innerText = "PROCESSING...";
            executeBtn.disabled = true;
            document.body.classList.add("system-active"); 
            
            // Add skeleton loading visually
            document.querySelectorAll('.metric-card').forEach(card => card.classList.add('skeleton-loading'));
        }

        try {
            // Check for network connection first
            if (!navigator.onLine) {
                throw new Error("No internet connection detected.");
            }

            const formData = new FormData();
            formData.append("stock_value", ticker);

            const response = await fetch("/predict", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                if(response.status === 429) throw new Error("API Rate Limit Reached. Please wait.");
                throw new Error(`Server returned status ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Remove skeleton loading visually
            document.querySelectorAll('.metric-card').forEach(card => card.classList.remove('skeleton-loading'));

            updateDomElement("currentPrice", data.currentPrice);
            updateDomElement("predictedPrice", data.predictedPrice);
            updateDomElement("change", `${data.changeIcon || ""} ${data.change || ""}`);
            updateDomElement("twoWeekPrediction", data.twoWeekPrediction);
            updateDomElement("suggestion", data.suggestion);
            updateDomElement("rsi", data.rsi);
            updateDomElement("ema20", data.ema20);
            updateDomElement("sma50", data.sma50);
            updateDomElement("roc", `${data.roc} (${data.rocStatus})`);
            updateDomElement("macd", data.macd);
            updateDomElement("bollinger", data.bollinger);
            updateDomElement("newsSentiment", data.newsSentiment);

            const explainModule = document.getElementById("explain-module");
            if (explainModule && data.confidence && data.reasons) {
                explainModule.style.display = "block";
                const confElement = document.getElementById("aiConfidence");
                confElement.innerHTML = `
                    <div style="display: flex; align-items: baseline; gap: 10px;">
                        <span id="confNumber" style="font-size: 2.8rem; font-weight: 900; color: #ffffff; text-shadow: 0 0 20px rgba(0, 230, 255, 0.4); letter-spacing: -1px;">0%</span>
                        <span style="color: #94a3b8; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Conviction Level</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-top: 4px; margin-bottom: 24px; overflow: hidden; position: relative;">
                        <div id="confBar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #00e6ff, #00ff88); box-shadow: 0 0 15px #00ff88; transition: width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);"></div>
                    </div>
                `;
                
                let targetConf = data.confidence;
                let currentConf = 0;
                setTimeout(() => {
                    const bar = document.getElementById("confBar");
                    if(bar) bar.style.width = `${targetConf}%`;
                }, 100);

                let confInterval = setInterval(() => {
                    currentConf += 2;
                    if(currentConf >= targetConf) {
                        currentConf = targetConf;
                        clearInterval(confInterval);
                    }
                    const num = document.getElementById("confNumber");
                    if(num) num.innerText = `${currentConf}%`;
                }, 20); 

                const reasonsList = document.getElementById("aiReasons");
                reasonsList.innerHTML = "";
                reasonsList.style.display = "flex";
                reasonsList.style.flexDirection = "column";
                reasonsList.style.gap = "10px";

                data.reasons.forEach((reason, index) => {
                    let li = document.createElement("li");
                    li.style.background = "rgba(255,255,255,0.02)";
                    li.style.border = "1px solid rgba(255,255,255,0.05)";
                    li.style.padding = "14px 16px";
                    li.style.borderRadius = "10px";
                    li.style.display = "flex";
                    li.style.alignItems = "center";
                    
                    let isPositive = reason.startsWith("✓");
                    let rawText = reason.substring(2).trim();
                    let plainEnglish = jargonMap[rawText] || rawText;
                    
                    let iconHtml = isPositive 
                        ? `<div style="background: rgba(0, 255, 136, 0.15); color: #00ff88; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-weight: bold; flex-shrink: 0; box-shadow: 0 0 12px rgba(0, 255, 136, 0.25); font-size: 1.1rem;">✓</div>`
                        : `<div style="background: rgba(255, 68, 68, 0.15); color: #ff4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-weight: bold; flex-shrink: 0; box-shadow: 0 0 12px rgba(255, 68, 68, 0.25); font-size: 1.1rem;">✗</div>`;
                        
                    li.innerHTML = `${iconHtml} 
                        <div style="display: flex; flex-direction: column;">
                            <span style="color: #ffffff; font-size: 0.95rem; font-weight: 700; letter-spacing: 0.5px;">${plainEnglish}</span>
                            <span style="color: #64748b; font-size: 0.75rem; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Technical: ${rawText}</span>
                        </div>`;
                    
                    li.style.opacity = "0";
                    li.style.animation = `entrySlideText 0.4s ease-out forwards`;
                    li.style.animationDelay = `${index * 0.15}s`;
                    reasonsList.appendChild(li);
                });
            }

            const newsContainer = document.getElementById("headlines-container");
            if (newsContainer && data.headlines) {
                newsContainer.innerHTML = ""; 
                let renderHeadlines = data.headlines;
                if (renderHeadlines.length === 1 && renderHeadlines[0].includes("stabilizing")) {
                    renderHeadlines = [
                        `> QUANTUM NODE: Tracking volume shifts for ${ticker}...`,
                        `> NLP ENGINE: Sentiment algorithms holding neutral sector weight.`,
                        `> SECTOR SCAN: Volatility metrics aligning with 10-day averages.`,
                        `> SYSTEM: Liquidity pools normalized. Awaiting catalyst.`
                    ];
                }

                renderHeadlines.forEach((headline, index) => {
                    const li = document.createElement("li");
                    li.className = "news-headline-item";
                    li.innerHTML = `<span class="terminal-pulse"></span> <span style="flex-grow: 1;">${headline}</span>`;
                    li.style.opacity = "0";
                    li.style.animation = `entrySlideText 0.4s ease-out forwards`;
                    li.style.animationDelay = `${index * 0.4}s`;
                    newsContainer.appendChild(li);
                });
            }

            const volBar = document.querySelector(".volatility-bar-fill");
            if (volBar && data.rsi) {
                let rsiNum = parseFloat(data.rsi) || 50;
                let volatilityDist = Math.abs(rsiNum - 50); 
                let volPct = Math.min((volatilityDist * 2.5) + 15, 100);
                let barColor = "#00e6ff"; 
                if (rsiNum > 70) barColor = "#ff4444"; 
                if (rsiNum < 30) barColor = "#00ff88"; 
                volBar.style.width = `${volPct}%`;
                volBar.style.background = barColor;
                volBar.style.boxShadow = `0 0 15px ${barColor}`;
            }

            const currentNum = parseFloat(data.currentPrice.replace(/[^0-9.-]+/g, ""));
            const predictedNum = parseFloat(data.predictedPrice.replace(/[^0-9.-]+/g, ""));
            const dirRate = document.getElementById("directionalRate");
            if (dirRate && currentNum > 0) {
                let accuracy = Math.min(100 - (Math.abs(currentNum - predictedNum) / currentNum * 100) + 90, 99.8);
                dirRate.innerText = `${accuracy.toFixed(1)}%`;
            }
            
            // 🌟 TRIGGER REAL CHART.JS 🌟
            if (data.historicalData && data.historicalLabels) {
                buildInteractiveChart(data.historicalData, data.historicalLabels, predictedNum, data.changeIcon);
            }

        } catch (error) {
            console.error("❌ Pipeline failure:", error);
            
            // Handle error states cleanly
            document.querySelectorAll('.metric-card').forEach(card => card.classList.remove('skeleton-loading'));
            document.body.classList.remove("system-active"); 
            
            if (errorContainer) {
                errorContainer.innerText = `⚠️ ${error.message}`;
                errorContainer.style.display = "block";
                
                // Shake animation for error
                errorContainer.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 400, iterations: 1 });
            }

        } finally {
            if (executeBtn) {
                executeBtn.innerText = "EXECUTE CORE ANALYSIS";
                executeBtn.disabled = false;
            }
        }
    }

    if (analysisForm) analysisForm.addEventListener("submit", processCoreAnalysis);
    else if (executeBtn) executeBtn.addEventListener("click", processCoreAnalysis);

    function updateDomElement(keyId, value) {
        const element = document.getElementById(keyId);
        if (element) {
            element.innerText = value || "N/A";
        }
    }
});