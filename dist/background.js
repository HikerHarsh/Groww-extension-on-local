"use strict";
// background.ts - Service Worker for the extension
console.log("Trade Analyzer Background Service Worker loaded.");
function calculateSMA(data, period) {
    if (data.length < period)
        return null;
    const slice = data.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
}
function calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < period + 1)
        return null;
    let tr = [];
    for (let i = 1; i < highs.length; i++) {
        const high = highs[i];
        const low = lows[i];
        const prevClose = closes[i - 1];
        const tr1 = high - low;
        const tr2 = Math.abs(high - prevClose);
        const tr3 = Math.abs(low - prevClose);
        tr.push(Math.max(tr1, tr2, tr3));
    }
    const recentTR = tr.slice(-period);
    return recentTR.reduce((a, b) => a + b, 0) / period;
}
async function analyzeStockWithRealData(stockName, ticker, currentPrice, durationType, balance = 0, customBalance = 0) {
    try {
        let yfTicker = ticker;
        if (!yfTicker.endsWith('.NS') && !yfTicker.endsWith('.BO')) {
            yfTicker = `${ticker}.NS`;
        }
        let interval = '1d';
        let range = '3mo';
        let slMultiplier = 1.5;
        let targetMultiplier = 3.0;
        if (durationType === 'Scalping') {
            interval = '5m';
            range = '5d';
            slMultiplier = 1.0;
            targetMultiplier = 3.0;
        }
        else if (durationType === 'Intraday') {
            interval = '15m';
            range = '1mo';
            slMultiplier = 1.2;
            targetMultiplier = 3.6;
        }
        else {
            interval = '1d';
            range = '3mo';
            slMultiplier = 1.5;
            targetMultiplier = 4.5;
        }
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfTicker}?interval=${interval}&range=${range}`;
        console.log(`Fetching ${durationType} data from:`, url);
        const response = await fetch(url);
        if (!response.ok)
            throw new Error("API Network response was not ok");
        const json = await response.json();
        const result = json.chart.result[0];
        const closes = result.indicators.quote[0].close;
        const highs = result.indicators.quote[0].high;
        const lows = result.indicators.quote[0].low;
        const validCloses = closes.filter((c) => c !== null);
        const validHighs = highs.filter((h) => h !== null);
        const validLows = lows.filter((l) => l !== null);
        if (validCloses.length < 20)
            throw new Error("Not enough data points");
        const latestClose = validCloses[validCloses.length - 1];
        const priceToUse = currentPrice > 0 ? currentPrice : latestClose;
        const sma20 = calculateSMA(validCloses, 20);
        const atr14 = calculateATR(validHighs, validLows, validCloses, 14);
        if (!sma20 || !atr14)
            throw new Error("Could not calculate indicators");
        let trend = priceToUse > sma20 ? "Bullish 🟢" : "Bearish 🔴";
        const slAmount = atr14 * slMultiplier;
        const targetAmount = atr14 * targetMultiplier;
        const riskPerShare = slAmount;
        let entry, sl, target;
        const decimals = durationType === 'Scalping' ? 2 : 1;
        if (priceToUse > sma20) {
            entry = `${(priceToUse - (atr14 * 0.2)).toFixed(decimals)} - ${priceToUse.toFixed(decimals)}`;
            sl = (priceToUse - slAmount).toFixed(decimals);
            target = `${(priceToUse + targetAmount).toFixed(decimals)}`;
        }
        else {
            trend = "Bearish 🔴 (Short)";
            entry = `${priceToUse.toFixed(decimals)} - ${(priceToUse + (atr14 * 0.2)).toFixed(decimals)}`;
            sl = (priceToUse + slAmount).toFixed(decimals);
            target = `${(priceToUse - targetAmount).toFixed(decimals)}`;
        }
        function getPositionSizing(bal) {
            if (bal <= 0)
                return { qty: "0", pnl: "-" };
            const maxRiskAllowed = bal * 0.01; // 1% risk (B6)
            // QTY = RISK / RISK/SHARE (B6/E4)
            let rawQty = maxRiskAllowed / riskPerShare;
            let riskQty = Math.floor(rawQty);
            // Margin/Buying Power Check
            let maxQtyByBuyingPower = Math.floor(bal / priceToUse); // 1x leverage for Swing
            if (durationType === 'Intraday' || durationType === 'Scalping') {
                maxQtyByBuyingPower = Math.floor((bal * 5) / priceToUse); // 5x leverage for Intraday/Scalping
            }
            let recQty = Math.max(0, Math.min(riskQty, maxQtyByBuyingPower));
            if (recQty > 0) {
                let eLoss = recQty * slAmount;
                let eProfit = recQty * targetAmount;
                return {
                    qty: recQty.toString(), // Output floored integer
                    pnl: `<span class="ta-green">+₹${eProfit.toFixed(0)}</span> &nbsp;|&nbsp; <span class="ta-red">-₹${eLoss.toFixed(0)}</span>`
                };
            }
            return { qty: "0", pnl: "-" };
        }
        const realPos = getPositionSizing(balance);
        const customPos = getPositionSizing(customBalance);
        let newsSentiment = "Neutral ⚪";
        let newsList = [];
        try {
            const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(stockName)}+stock+india&hl=en-IN&gl=IN&ceid=IN:en`;
            const rssRes = await fetch(rssUrl);
            if (rssRes.ok) {
                const rssText = await rssRes.text();
                let score = 0;
                const posWords = ['profit', 'growth', 'surge', 'up', 'buy', 'rally', 'breakout', 'dividend', 'positive', 'win', 'upgrade', 'robust', 'high', 'jump', 'climb', 'beat', 'bullish', 'partner', 'launch'];
                const negWords = ['loss', 'fall', 'crash', 'down', 'sell', 'drop', 'poor', 'negative', 'fail', 'downgrade', 'weak', 'low', 'slide', 'miss', 'slump', 'bearish', 'penalty', 'lawsuit', 'debt'];
                const itemRegex = /<item>[\s\S]*?<\/item>/g;
                let match;
                while ((match = itemRegex.exec(rssText)) !== null && newsList.length < 5) {
                    const itemStr = match[0];
                    const titleMatch = itemStr.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
                    const linkMatch = itemStr.match(/<link>(.*?)<\/link>/);
                    let title = "";
                    if (titleMatch)
                        title = titleMatch[1] || titleMatch[2];
                    let link = "";
                    if (linkMatch)
                        link = linkMatch[1];
                    if (title && link) {
                        const cleanTitle = title.split(' - ')[0]; // Remove publication name
                        const lowerTitle = cleanTitle.toLowerCase();
                        let itemScore = 0;
                        posWords.forEach(w => {
                            if (new RegExp('\\b' + w + '\\b').test(lowerTitle)) {
                                score++;
                                itemScore++;
                            }
                        });
                        negWords.forEach(w => {
                            if (new RegExp('\\b' + w + '\\b').test(lowerTitle)) {
                                score--;
                                itemScore--;
                            }
                        });
                        let itemSentiment = '⚪';
                        if (itemScore > 0)
                            itemSentiment = '🟢';
                        else if (itemScore < 0)
                            itemSentiment = '🔴';
                        newsList.push({ title: cleanTitle, link: link, sentiment: itemSentiment });
                    }
                }
                if (score > 0)
                    newsSentiment = `Bullish 🟢 (+${score})`;
                else if (score < 0)
                    newsSentiment = `Bearish 🔴 (${score})`;
                else
                    newsSentiment = `Neutral ⚪ (0)`;
            }
        }
        catch (e) {
            console.log("Error fetching news:", e);
        }
        return {
            success: true,
            data: {
                trend: trend,
                entry: `₹${entry}`,
                sl: `₹${sl}`,
                target: `₹${target}`,
                duration: durationType,
                realBal: balance,
                realQty: realPos.qty,
                realPnl: realPos.pnl,
                customQty: customPos.qty,
                customPnl: customPos.pnl,
                newsSentiment: newsSentiment,
                newsList: newsList
            }
        };
    }
    catch (error) {
        console.error("Error fetching real data:", error);
        return null;
    }
}
async function analyzePositionsWithRealData(positions, durationType) {
    try {
        const results = [];
        let totalScore = 0;
        for (const pos of positions) {
            // --- 1. Ticker Resolution: Try NSE first, then search ---
            let yfTicker = '';
            // Build NSE ticker from company name
            const nseTicker = pos.company
                .replace(/limited|ltd|ltd\.|pvt|private|\(india\)|india/gi, '')
                .trim()
                .split(' ')[0]
                .toUpperCase() + '.NS';
            // Validate by fetching a quick quote
            try {
                const validateRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${nseTicker}?interval=1d&range=5d`);
                const validateData = await validateRes.json();
                if (validateData.chart && validateData.chart.result && validateData.chart.result.length > 0) {
                    yfTicker = nseTicker;
                }
            }
            catch (e) { /* try search */ }
            // Fallback: Yahoo Finance search
            if (!yfTicker) {
                try {
                    const searchRes = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(pos.company + ' NSE')}&quotesCount=5&newsCount=0`, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    const searchJson = await searchRes.json();
                    if (searchJson.quotes) {
                        // Prefer .NS ticker
                        const nseQuote = searchJson.quotes.find((q) => q.symbol && q.symbol.endsWith('.NS'));
                        if (nseQuote)
                            yfTicker = nseQuote.symbol;
                        else if (searchJson.quotes[0]) {
                            yfTicker = searchJson.quotes[0].symbol;
                            if (yfTicker.endsWith('.BO'))
                                yfTicker = yfTicker.replace('.BO', '.NS');
                        }
                    }
                }
                catch (e) { /* use fallback */ }
            }
            if (!yfTicker)
                yfTicker = nseTicker;
            // --- 2. Fetch chart data ---
            // For intraday: today's 5m candles. For swing: 3mo daily.
            const interval = durationType === 'Intraday' ? '5m' : '1d';
            const range = durationType === 'Intraday' ? '1d' : '3mo';
            let trend = 'Neutral';
            let holdConfidence = 50;
            let recommendation = 'Hold';
            let stopLoss = 0;
            let target = 0;
            let projectedPrices = [];
            const currentPrice = pos.mktPrice > 0 ? pos.mktPrice : pos.avgPrice;
            const avgPrice = pos.avgPrice > 0 ? pos.avgPrice : currentPrice;
            const isLong = pos.qty > 0 || pos.qty === 0; // treat 0 qty as long for display
            try {
                const chartRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yfTicker}?interval=${interval}&range=${range}`);
                const chartData = await chartRes.json();
                if (chartData.chart && chartData.chart.result && chartData.chart.result.length > 0) {
                    const result = chartData.chart.result[0];
                    const quote = result.indicators.quote[0];
                    const closes = (quote.close || []).filter((c) => c !== null && c > 0);
                    const highs = (quote.high || []).filter((h) => h !== null && h > 0);
                    const lows = (quote.low || []).filter((l) => l !== null && l > 0);
                    const minLen = Math.min(closes.length, highs.length, lows.length);
                    if (minLen >= 5) {
                        // ATR calculation
                        const atrPeriod = Math.min(14, minLen - 1);
                        const atr = calculateATR(highs.slice(0, minLen), lows.slice(0, minLen), closes.slice(0, minLen), atrPeriod) || (currentPrice * 0.015);
                        // SMA trend
                        const smaPeriod = Math.min(20, minLen);
                        const sma = calculateSMA(closes, smaPeriod);
                        if (sma) {
                            if (currentPrice > sma) {
                                trend = 'Bullish';
                                holdConfidence = Math.min(90, 55 + ((currentPrice - sma) / atr) * 8);
                            }
                            else {
                                trend = 'Bearish';
                                holdConfidence = Math.max(10, 45 - ((sma - currentPrice) / atr) * 8);
                            }
                        }
                        // --- 3. SL & Target: ATR-based from AVG PRICE (entry), 1:2 RR ---
                        const slMultiplier = durationType === 'Intraday' ? 1.0 : 1.5;
                        const riskAmount = atr * slMultiplier;
                        if (isLong) {
                            // Long: SL below avg, Target above with 1:2 RR
                            stopLoss = Math.max(avgPrice - riskAmount, avgPrice * 0.92); // cap at 8% loss
                            target = avgPrice + (riskAmount * 2.0);
                        }
                        else {
                            // Short: SL above avg, Target below
                            stopLoss = Math.min(avgPrice + riskAmount, avgPrice * 1.08);
                            target = avgPrice - (riskAmount * 2.0);
                        }
                        // Recommendation based on current P&L vs risk
                        const pnlPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
                        const riskPercent = (riskAmount / avgPrice) * 100;
                        if (pnlPercent > riskPercent * 2) {
                            recommendation = 'Book Partial'; // already at 2R profit
                        }
                        else if (isLong && currentPrice < stopLoss) {
                            recommendation = 'Exit All'; // stop already breached
                        }
                        else if (!isLong && currentPrice > stopLoss) {
                            recommendation = 'Exit All';
                        }
                        else if (pnlPercent < 0 && trend === 'Bullish' && isLong) {
                            recommendation = 'Add More'; // dip in uptrend
                        }
                        else {
                            recommendation = 'Hold';
                        }
                        // Projected prices: smoother simulation
                        let lastP = currentPrice;
                        const driftPer = (trend === 'Bullish' ? 1 : trend === 'Bearish' ? -1 : 0) * (atr / 20);
                        const noise = atr * 0.3;
                        for (let i = 0; i < 20; i++) {
                            lastP = lastP + driftPer + (Math.random() - 0.5) * noise;
                            projectedPrices.push(parseFloat(lastP.toFixed(2)));
                        }
                    }
                }
            }
            catch (chartErr) {
                console.error('Chart fetch error for', yfTicker, chartErr);
            }
            // Fallback if no chart data
            if (stopLoss === 0 || target === 0) {
                const fallbackRisk = avgPrice * (durationType === 'Intraday' ? 0.01 : 0.02);
                if (isLong) {
                    stopLoss = avgPrice - fallbackRisk;
                    target = avgPrice + fallbackRisk * 2;
                }
                else {
                    stopLoss = avgPrice + fallbackRisk;
                    target = avgPrice - fallbackRisk * 2;
                }
            }
            if (projectedPrices.length === 0) {
                let lastP = currentPrice;
                for (let i = 0; i < 20; i++) {
                    lastP += (Math.random() - 0.5) * (currentPrice * 0.005);
                    projectedPrices.push(parseFloat(lastP.toFixed(2)));
                }
            }
            holdConfidence = Math.max(0, Math.min(100, Math.round(holdConfidence)));
            results.push({
                company: pos.company,
                ticker: yfTicker,
                holdConfidence,
                recommendation,
                stopLoss: parseFloat(stopLoss.toFixed(2)),
                target: parseFloat(target.toFixed(2)),
                projectedPrices,
                trend
            });
            totalScore += holdConfidence;
        }
        const overallHealth = positions.length > 0 ? Math.round(totalScore / positions.length) : 0;
        return {
            success: true,
            data: {
                overallHealth,
                positions: results
            }
        };
    }
    catch (error) {
        console.error("Error analyzing positions:", error);
        return null;
    }
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ANALYZE_STOCK') {
        const req = request;
        const stockName = req.stockName;
        const ticker = req.ticker;
        const currentPrice = req.currentPrice;
        const durationType = req.durationType || 'Swing';
        const balance = req.balance || 0;
        const customBalance = req.customBalance || 0;
        analyzeStockWithRealData(stockName, ticker, currentPrice, durationType, balance, customBalance).then(realData => {
            if (realData) {
                sendResponse(realData);
            }
            else {
                sendResponse({ success: false });
            }
        });
        return true;
    }
    else if (request.type === 'ANALYZE_POSITIONS') {
        const req = request;
        analyzePositionsWithRealData(req.positions, req.durationType).then(res => {
            if (res) {
                sendResponse(res);
            }
            else {
                sendResponse({ success: false });
            }
        });
        return true;
    }
    else if (request.type === 'FETCH_GMP') {
        // Fetch IPO GMP data from ipowatch.in
        fetch('https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        })
            .then(res => res.text())
            .then(html => {
            const gmpData = [];
            // ipowatch.in has a WordPress table - find all <tr> rows
            const tableStart = html.indexOf('<table');
            if (tableStart === -1) {
                sendResponse({ success: false, error: 'No table found' });
                return;
            }
            const tableEnd = html.indexOf('</table>', tableStart);
            const tableHtml = html.substring(tableStart, tableEnd + 8);
            // Extract all <tr> rows
            const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
            let rowMatch;
            let rowCount = 0;
            while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
                rowCount++;
                if (rowCount === 1)
                    continue; // Skip header row
                const row = rowMatch[1];
                const cells = [];
                const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
                let cellMatch;
                while ((cellMatch = cellRegex.exec(row)) !== null) {
                    const clean = cellMatch[1]
                        .replace(/<[^>]+>/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&#8211;/g, '-')
                        .replace(/\s+/g, ' ')
                        .trim();
                    cells.push(clean);
                }
                // ipowatch columns: 0=Name, 1=GMP, 2=Status, 3=IPO Price, 4=Expected Price, 5=Dates, etc.
                if (cells.length >= 5) {
                    const name = cells[0];
                    const gmpStr = cells[1] || '0';
                    const ipoPriceStr = cells[3] || '0';
                    const expectedStr = cells[4] || '0';
                    const ipoPrice = parseFloat(ipoPriceStr.replace(/[^\d.]/g, '')) || 0;
                    // Handle negative GMP (if ipowatch uses minus sign)
                    let gmp = parseFloat(gmpStr.replace(/[^\d.-]/g, '')) || 0;
                    if (gmpStr.includes('-'))
                        gmp = -Math.abs(gmp);
                    const expectedPrice = ipoPrice + gmp;
                    if (name && name.length > 2) {
                        gmpData.push({ name, gmp, expectedPrice, ipoPrice, change: '' });
                    }
                }
            }
            sendResponse({ success: true, data: gmpData });
        })
            .catch(err => {
            console.error('GMP fetch error:', err);
            sendResponse({ success: false, error: err.message });
        });
        return true;
    }
});
