// content.ts - Seamless integration into broker UI

console.log("Trade Analyzer: Native Integration Script Loaded");

let currentDuration: string = 'Swing'; // Default
let activeCustomBalance: number = 0;

function injectNativeWidget(targetElement: Element, stockName: string, ticker: string, currentPrice: number) {
  if (document.getElementById('ta-native-widget')) return;

  const widget = document.createElement('div');
  widget.id = 'ta-native-widget';
  
  widget.innerHTML = `
    <div style="display: flex; gap: 20px;">
      <!-- Main Panel -->
      <div style="flex: 2;">
        <div class="ta-native-header">
          <div class="ta-title-wrapper">
            <span class="ta-native-title">Trade Insights</span>
            <div class="ta-duration-selector">
              <button class="ta-duration-btn" data-type="Scalping">Scalping</button>
              <button class="ta-duration-btn" data-type="Intraday">Intraday</button>
              <button class="ta-duration-btn active" data-type="Swing">Swing</button>
            </div>
          </div>
          <span class="ta-powered-by">Powered by AI ⚡</span>
        </div>
        <div class="ta-native-body">
          <div id="ta-native-loading">Analyzing Market Data... <span class="ta-spinner"></span></div>
          <div id="ta-native-results" style="display: none;">
            <div class="ta-stat-box">
              <div class="ta-stat-label">Trend & News</div>
              <div class="ta-stat-value" id="ta-val-trend">-</div>
            </div>
        <div class="ta-stat-box">
          <div class="ta-stat-label">Best Entry</div>
          <div class="ta-stat-value ta-blue" id="ta-val-entry">-</div>
        </div>
        <div class="ta-stat-box">
          <div class="ta-stat-label">Stop Loss</div>
          <div class="ta-stat-value ta-red" id="ta-val-sl">-</div>
        </div>
        <div class="ta-stat-box">
          <div class="ta-stat-label">Target</div>
          <div class="ta-stat-value ta-green" id="ta-val-target">-</div>
        </div>
        
        <div class="ta-section-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Broker Balance (<span id="ta-val-real-bal-disp">₹0</span>)</span>
          <button id="ta-btn-execute" style="background:#00d09c; color:white; border:none; padding:4px 12px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">EXECUTE ⚡</button>
        </div>
        <div class="ta-stat-box">
          <div class="ta-stat-label">Rec. Qty</div>
          <div class="ta-stat-value ta-blue" id="ta-val-real-qty">-</div>
        </div>
        <div class="ta-stat-box">
          <div class="ta-stat-label">Est. P&L</div>
          <div class="ta-stat-value" id="ta-val-real-pnl">-</div>
        </div>

        <div class="ta-section-title">Custom Calculator</div>
        <div class="ta-stat-box" style="flex-basis: 100%; margin-bottom: 4px;">
          <input type="number" id="ta-custom-balance" placeholder="Enter Custom Balance ₹" style="width: 100%; font-size: 12px; border: 1px solid #e3e6e8; border-radius: 4px; padding: 6px; font-family: inherit; color: #44475b; outline: none; background: #f9f9fa;" />
        </div>
        <div class="ta-stat-box">
          <div class="ta-stat-label">Rec. Qty</div>
          <div class="ta-stat-value ta-blue" id="ta-val-custom-qty">-</div>
        </div>
        <div class="ta-stat-box">
          <div class="ta-stat-label">Est. P&L</div>
          <div class="ta-stat-value" id="ta-val-custom-pnl">-</div>
          </div>
        </div>
      </div>
      <!-- News Panel -->
      <div id="ta-news-panel" style="flex: 1; border-left: 1px dashed #e3e6e8; padding-left: 20px; display: none; flex-direction: column;">
         <div class="ta-native-title" style="margin-bottom: 12px; font-size: 13px; color:#7b809a; text-transform:uppercase;">Latest News</div>
         <div id="ta-news-list" style="display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: #44475b; line-height: 1.4;">
            <!-- News items will go here -->
         </div>
      </div>
    </div>
  `;

  if (targetElement.parentNode) {
    targetElement.parentNode.insertBefore(widget, targetElement.nextSibling);
  }

  // Setup click listener for Execute button
  const executeBtn = widget.querySelector('#ta-btn-execute');
  if (executeBtn) {
    executeBtn.addEventListener('click', () => {
      const trendText = document.getElementById('ta-val-trend')?.innerText || '';
      const isSell = trendText.toLowerCase().includes('bearish');
      
      const allDivs = Array.from(document.querySelectorAll('div'));
      for (const div of allDivs) {
          if (div.innerText === (isSell ? 'SELL' : 'BUY') && (div.className.includes('tab') || div.className.includes('buySell') || div.className.includes('absolute-center'))) {
              div.click();
              break;
          }
      }
      
      const durationMap: Record<string, string> = {
          'Scalping': 'Intraday',
          'Intraday': 'Intraday',
          'Swing': 'Delivery'
      };
      const targetDuration = durationMap[currentDuration] || 'Delivery';
      
      setTimeout(() => {
          const allTextEls = Array.from(document.querySelectorAll('div, span, button'));
          for (const el of allTextEls) {
              const hEl = el as HTMLElement;
              if (hEl.innerText === targetDuration && (hEl.className.includes('pill') || hEl.style.borderRadius)) {
                  hEl.click();
                  break;
              }
          }
          
          const qtyText = document.getElementById('ta-val-real-qty')?.innerText || '0';
          const qty = parseInt(qtyText, 10);
          if (!isNaN(qty) && qty > 0) {
              const inputs = Array.from(document.querySelectorAll('input'));
              for (const input of inputs) {
                  if (input.id === 'ta-custom-balance') continue;
                  if (input.closest('#ta-native-widget')) continue;
                  
                  const isQtyInput = input.id === 'inputShare' || 
                                     input.className.includes('qtyinputbox') || 
                                     (input.parentElement && (input.parentElement.innerText.includes('Qty') || input.parentElement.innerText.includes('NSE') || input.parentElement.innerText.includes('BSE')));

                  if (isQtyInput) {
                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                      if (nativeInputValueSetter) {
                          nativeInputValueSetter.call(input, qty.toString());
                      } else {
                          input.value = qty.toString();
                      }
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                      break;
                  }
              }
          }

          const slText = document.getElementById('ta-val-sl')?.innerText || '';
          const targetText = document.getElementById('ta-val-target')?.innerText || '';
          
          const labels = Array.from(document.querySelectorAll('span, div, label'));
          
          const legInputs = Array.from(document.querySelectorAll('input[class*="leg_input"]')) as HTMLInputElement[];
          if (legInputs.length > 0) {
              let slInput: HTMLInputElement | null = null;
              let targetInput: HTMLInputElement | null = null;

              for (const input of legInputs) {
                  const closestContainer = input.closest('div[class*="stoploss-and-target"]') as HTMLElement | null;
                  const containerText = closestContainer?.innerText?.toLowerCase() || input.parentElement?.parentElement?.innerText?.toLowerCase() || '';
                  if (containerText.includes('stoploss') || containerText.includes('stop loss')) {
                      slInput = input;
                  } else if (containerText.includes('target')) {
                      targetInput = input;
                  }
              }

              if (!slInput && legInputs.length > 0) slInput = legInputs[0];
              if (!targetInput && legInputs.length > 1) targetInput = legInputs[1];

              const setNativeValue = (el: HTMLInputElement, val: string) => {
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                  if (nativeInputValueSetter) {
                      nativeInputValueSetter.call(el, val);
                  } else {
                      el.value = val;
                  }
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                  el.dispatchEvent(new Event('change', { bubbles: true }));
              };

              if (slInput && slText && slText !== '-') {
                  setNativeValue(slInput, slText.replace('₹', '').trim());
              }
              if (targetInput && targetText && targetText !== '-') {
                  setNativeValue(targetInput, targetText.replace('₹', '').trim());
              }
          } else {
              for (const label of labels) {
                  if (label.children.length > 0) continue;
                  if (label.closest('#ta-native-widget')) continue;
                  
                  const text = (label as HTMLElement).innerText?.toLowerCase() || '';
                  if (text === 'stop loss' || text === 'stoploss' || text === 'trigger price' || text.includes('stop loss') || text.includes('stoploss') || text.includes('trigger price')) {
                      const input = label.parentElement?.parentElement?.querySelector('input') || label.parentElement?.querySelector('input');
                      if (input && slText && slText !== '-') {
                          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                          const slVal = slText.replace('₹', '').trim();
                          if (nativeInputValueSetter) {
                              nativeInputValueSetter.call(input, slVal);
                          } else {
                              input.value = slVal;
                          }
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                  }
                  
                  if (text.includes('target') && !text.includes('target price')) {
                      const input = label.parentElement?.parentElement?.querySelector('input') || label.parentElement?.querySelector('input');
                      if (input && targetText && targetText !== '-') {
                          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                          const targetVal = targetText.replace('₹', '').trim();
                          if (nativeInputValueSetter) {
                              nativeInputValueSetter.call(input, targetVal);
                          } else {
                              input.value = targetVal;
                          }
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                  }
              }
          }
      }, 300);
    });
  }

  // Setup click listeners for duration toggle
  const durationBtns = widget.querySelectorAll('.ta-duration-btn');
  durationBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Remove active class from all
      durationBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked
      target.classList.add('active');
      
      currentDuration = target.getAttribute('data-type') || 'Swing';
      fetchAnalysisData(stockName, ticker, currentPrice, currentDuration, activeCustomBalance);
    });
  });

  const balInput = document.getElementById('ta-custom-balance') as HTMLInputElement;
  const handleBalChange = () => {
    const val = parseFloat(balInput.value);
    if (!isNaN(val) && val > 0) {
      activeCustomBalance = val;
      fetchAnalysisData(stockName, ticker, currentPrice, currentDuration, activeCustomBalance);
    }
  };
  balInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleBalChange(); });
  balInput.addEventListener('blur', handleBalChange);



  let balCheckCount = 0;
  const balInterval = setInterval(() => {
      balCheckCount++;
      if (balCheckCount > 15) { clearInterval(balInterval); return; }
      const bodyText = document.body.innerText;
      const match = bodyText.match(/Balance\s*:\s*₹?\s*([0-9,.]+)/i);
      if (match && match[1]) {
          const newBal = parseFloat(match[1].replace(/,/g, ''));
          const dispEl = document.getElementById('ta-val-real-bal-disp');
          const currentDispBal = dispEl ? parseFloat(dispEl.innerText.replace(/[^0-9.]/g, '')) : 0;
          if (!isNaN(newBal) && newBal > 0 && newBal !== currentDispBal) {
              fetchAnalysisData(stockName, ticker, currentPrice, currentDuration, activeCustomBalance);
              clearInterval(balInterval);
          }
      }
  }, 1000);

  fetchAnalysisData(stockName, ticker, currentPrice, currentDuration, activeCustomBalance);
}

function fetchAnalysisData(stockName: string, ticker: string, currentPrice: number, durationType: string, customBalance: number) {
  const resultsDiv = document.getElementById('ta-native-results');
  const loadingDiv = document.getElementById('ta-native-loading');
  if (resultsDiv) resultsDiv.style.display = 'none';
  if (loadingDiv) loadingDiv.style.display = 'block';

  let balance = 0;
  const bodyText = document.body.innerText;
  // Match "Balance : ₹1,537" or "Balance\n:\n₹1,537"
  const match = bodyText.match(/Balance\s*:\s*₹?\s*([0-9,.]+)/i);
  if (match && match[1]) {
      balance = parseFloat(match[1].replace(/,/g, ''));
      if (isNaN(balance)) balance = 0;
  }

  const requestData: AnalysisRequest = { 
    type: 'ANALYZE_STOCK', 
    stockName: stockName, 
    ticker: ticker, 
    currentPrice: currentPrice,
    durationType: durationType,
    balance: balance,
    customBalance: customBalance
  };

  chrome.runtime.sendMessage(requestData, (response: AnalysisResponse) => {
    if (loadingDiv) loadingDiv.style.display = 'none';
    
    if (response && response.success && response.data) {
      if (resultsDiv) resultsDiv.style.display = 'flex';
      
      const setText = (id: string, text: string) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
      };
      
      const setHTML = (id: string, html: string) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      
      setText('ta-val-trend', `${response.data.trend} | ${response.data.newsSentiment}`);
      setText('ta-val-entry', response.data.entry);
      setText('ta-val-sl', response.data.sl);
      setText('ta-val-target', response.data.target);
      
      setText('ta-val-real-bal-disp', `₹${response.data.realBal.toLocaleString()}`);
      setText('ta-val-real-qty', response.data.realQty);
      setHTML('ta-val-real-pnl', response.data.realPnl);
      
      setText('ta-val-custom-qty', response.data.customQty);
      setHTML('ta-val-custom-pnl', response.data.customPnl);
      
      // Update News list
      const newsPanel = document.getElementById('ta-news-panel');
      const newsListEl = document.getElementById('ta-news-list');
      if (newsPanel && newsListEl && response.data.newsList && response.data.newsList.length > 0) {
          newsPanel.style.display = 'flex';
          newsListEl.innerHTML = response.data.newsList.slice(0, 4).map((n: any) => 
              `<div style="border-bottom: 1px solid #f1f2f4; padding-bottom: 8px;">
                 <a href="${n.link}" target="_blank" style="color: inherit; text-decoration: none;">
                    ${n.sentiment} <span style="cursor: pointer;" onmouseover="this.style.color='#00d09c'" onmouseout="this.style.color='inherit'">${n.title}</span>
                 </a>
               </div>`
          ).join('');
      } else if (newsPanel) {
          newsPanel.style.display = 'none';
      }
    } else {
      if (loadingDiv) loadingDiv.innerHTML = "Error analyzing data. Check console.";
    }
  });
}

function scanPageForInjection() {
  if (document.getElementById('ta-native-widget')) return;

  const hostname = window.location.hostname;
  let targetElement: Element | null = null;
  let stockName = "";
  let ticker = "";
  let currentPrice = 0;

  if (hostname.includes('groww.in')) {
    targetElement = document.querySelector('h1');
    if (targetElement) {
        stockName = (targetElement as HTMLElement).innerText;
        
        const allText = document.body.innerText;
        const nseMatch = allText.match(/([A-Z0-9]+)\s*•\s*NSE/i);
        if (nseMatch && nseMatch[1]) {
            ticker = nseMatch[1];
        } else {
            ticker = stockName.split(' ')[0].toUpperCase(); 
        }

        const priceElements = document.querySelectorAll('span, div');
        for (let i = 0; i < priceElements.length; i++) {
            const el = priceElements[i] as HTMLElement;
            const text = el.innerText;
            if (text && text.includes('₹') && el.style && window.getComputedStyle(el).fontSize > '20px') {
                const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                if (!isNaN(num) && num > 0) {
                    currentPrice = num;
                    break;
                }
            }
        }

        if(stockName.length > 0
            && !window.location.pathname.includes('/stocks/user/positions')
            && !window.location.pathname.includes('/ipo')
            && !window.location.pathname.includes('/mutual-funds')
        ) {
            injectNativeWidget(targetElement, stockName, ticker, currentPrice);
            injectMarketDepthVisualizer();
            injectPricePrediction();
        }
    } 
    
    if (window.location.pathname.includes('/stocks/user/positions')) {
        if (!document.getElementById('ta-positions-analyzer')) {
            injectPositionsAnalyzer();
        }
    } else if (window.location.pathname.includes('/mutual-funds/user/dashboard') || window.location.pathname.includes('/mutual-funds/dashboard')) {
        injectMutualFundProjector();
    } else if (window.location.pathname.includes('/ipo') || window.location.search.includes('filter=mainboard') || window.location.search.includes('filter=sme')) {
        initIPOGMP();
    }
  } else if (hostname.includes('fyers.in')) {
    targetElement = document.querySelector('.symbol-name') || document.querySelector('h1');
    if (targetElement) {
        stockName = (targetElement as HTMLElement).innerText.split(' ')[0];
        ticker = stockName;
        injectNativeWidget(targetElement, stockName, ticker, currentPrice);
    }
  }
}

let gmpInjected = false;
let gmpData: { name: string; gmp: number; expectedPrice: number; ipoPrice: number; change: string }[] = [];

function fuzzyMatch(a: string, b: string): boolean {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ca = clean(a), cb = clean(b);
    return ca.includes(cb) || cb.includes(ca);
}

function injectIPOColumn() {
    if (!gmpData || !gmpData.length) return;
    try {
        // Groww's thead does not have a tr inside it! The th elements are direct children of thead.
        const theads = document.querySelectorAll('thead');
        theads.forEach(thead => {
            if (thead.querySelector('.ta-gmp-th')) return;
            const ths = thead.querySelectorAll('th');
            if (ths.length < 2) return;
            const targetTh = ths[ths.length - 1]; // Insert before the last column (Apply button)
            
            const newTh = document.createElement('th');
            newTh.className = 'ta-gmp-th contentPrimary bodySmallHeavy tableComponent_cellPadding__7FhJ2 tableComponent_headerCellBorder__kd1Xb';
            newTh.style.cssText = 'text-align:left; width:15%; color:#3a5bbf;';
            newTh.innerHTML = 'GMP <span style="font-size:10px">🤖</span>';
            thead.insertBefore(newTh, targetTh);
        });

        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            if (row.querySelector('.ta-gmp-td')) return;
            
            const nameSpan = row.querySelector('span[aria-label="Company name"], td span.contentPrimary.truncate') as HTMLElement | null;
            if (!nameSpan) return;
            
            let rowName = nameSpan.innerText?.trim() || '';
            
            const targetTd = row.lastElementChild;
            if (!targetTd) return;

            const newTd = document.createElement('td');
            newTd.className = 'ta-gmp-td contentPrimary bodyBase tableComponent_cellPadding__7FhJ2';
            newTd.style.cssText = 'text-align:left;';
            
            const match = gmpData.find(g => fuzzyMatch(rowName, g.name));
            if (match && rowName.length >= 3) {
                const gmpColor = match.gmp >= 0 ? '#00b386' : '#eb5b3c';
                const gmpSign = match.gmp > 0 ? '+' : '';
                newTd.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <span style="font-weight:700; color:#444;">₹${match.expectedPrice.toFixed(0)}</span>
                        <span style="color:${gmpColor}; font-size:12px; font-weight:600;">${gmpSign}₹${match.gmp}</span>
                    </div>
                `;
            } else {
                newTd.innerHTML = '<span style="color:#999; font-size:12px;">N/A</span>';
            }
            
            row.insertBefore(newTd, targetTd);
        });
    } catch (e) {
        console.error('Error injecting IPO column:', e);
    }
}

function initIPOGMP() {
    if (gmpInjected) {
        injectIPOColumn();
        return;
    }
    gmpInjected = true;
    chrome.runtime.sendMessage({ type: 'FETCH_GMP' }, (response) => {
        if (response && response.success && response.data) {
            gmpData = response.data;
            injectIPOColumn();
            setInterval(injectIPOColumn, 1500);
        }
    });
}

function injectMarketDepthVisualizer() {
    if (!window.location.hostname.includes('groww.in')) return;
    if (document.getElementById('ta-depth-widget')) return;

    let marketDepthHeading: HTMLElement | null = null;
    let bidTotalEl: HTMLElement | null = null;

    const els = document.querySelectorAll('div, span, h2, h3');
    for (let i = 0; i < els.length; i++) {
        const node = els[i] as HTMLElement;
        if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
            const text = node.innerText.trim();
            if (text === 'Market depth') marketDepthHeading = node;
            if (text === 'Bid Total') bidTotalEl = node;
        }
    }

    if (!marketDepthHeading || !bidTotalEl) return;

    const widget = document.createElement('div');
    widget.id = 'ta-depth-widget';
    widget.style.cssText = "margin: 0 0 24px 0; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e3e6e8; font-family: inherit; box-shadow: 0 1px 4px rgba(0,0,0,0.04); position: relative;";
    
    const isDark = document.body.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark-mode') || window.getComputedStyle(document.body).backgroundColor === 'rgb(18, 18, 18)' || window.getComputedStyle(document.body).backgroundColor === 'rgb(30, 30, 36)';
    if (isDark) {
        widget.style.background = '#1e1e24';
        widget.style.borderColor = '#2b2b36';
        widget.style.color = '#e0e0e0';
    }

    widget.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 25px; display: flex; justify-content: space-between; color: ${isDark ? '#fff' : '#44475b'}">
            <span>Market Depth Visualizer</span>
            <span style="font-size: 12px; color: #7b809a; font-weight: 400;">Live ⚡</span>
        </div>
        <div style="position: relative; height: 180px; width: 100%; margin-top: 10px;" id="ta-depth-chart-container">
            <svg id="ta-depth-svg" width="100%" height="100%" style="overflow: visible; display: block;">
                <defs>
                    <linearGradient id="ta-depth-grad-green" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00d09c" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="#00d09c" stop-opacity="0.0"/>
                    </linearGradient>
                    <linearGradient id="ta-depth-grad-red" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#eb5b3c" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="#eb5b3c" stop-opacity="0.0"/>
                    </linearGradient>
                </defs>
                <path id="ta-depth-area-bid" fill="url(#ta-depth-grad-green)" d=""></path>
                <path id="ta-depth-line-bid" fill="none" stroke="#00d09c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d=""></path>
                <path id="ta-depth-area-ask" fill="url(#ta-depth-grad-red)" d=""></path>
                <path id="ta-depth-line-ask" fill="none" stroke="#eb5b3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d=""></path>
                <g id="ta-depth-hover-layer"></g>
            </svg>
            <div id="ta-depth-mid-price" style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: ${isDark ? '#2b2b36' : '#f1f2f4'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; color: ${isDark ? '#e0e0e0' : '#44475b'};"></div>
        </div>
    `;

    let insertTarget = marketDepthHeading;
    if (marketDepthHeading.parentElement && marketDepthHeading.parentElement.childElementCount === 1) {
        insertTarget = marketDepthHeading.parentElement;
    }
    if (insertTarget.parentNode) {
        insertTarget.parentNode.insertBefore(widget, insertTarget);
    }

    let tooltip = document.getElementById('ta-depth-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'ta-depth-tooltip';
        tooltip.style.cssText = 'position: absolute; display: none; background: #2b2b36; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; pointer-events: none; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); white-space: nowrap; transition: opacity 0.2s; opacity: 0; font-family: inherit; border: 1px solid #3c3c4a; transform: translate(-50%, -100%); margin-top: -15px;';
        document.body.appendChild(tooltip);
    }

    setInterval(() => {
        if (!document.getElementById('ta-depth-widget')) return;

        // Find "Bid Price" header label — look for a leaf element with exactly that text
        let bidPriceEl: HTMLElement | null = null;
        const allEls = document.querySelectorAll('*');
        for (let i = 0; i < allEls.length; i++) {
            const el = allEls[i] as HTMLElement;
            if (!el.children.length && el.innerText && el.innerText.trim() === 'Bid Price') {
                bidPriceEl = el;
                break;
            }
        }
        if (!bidPriceEl) return;

        // Walk up to find a section that contains Ask Price too
        let section: HTMLElement | null = bidPriceEl;
        for (let up = 0; up < 12; up++) {
            if (!section) break;
            if (section.innerText && section.innerText.includes('Ask Price')) break;
            section = section.parentElement;
        }
        if (!section || !section.innerText.includes('Ask Price')) return;

        // Collect all visible numeric text nodes in this section with their screen positions
        const nodes: {val: number, x: number, y: number}[] = [];
        const treeWalker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
        let textNode: Node | null;
        while ((textNode = treeWalker.nextNode())) {
            const raw = (textNode.textContent || '').trim().replace(/,/g, '');
            const num = parseFloat(raw);
            if (isNaN(num) || num <= 0) continue;
            const par = textNode.parentElement as HTMLElement;
            if (!par) continue;
            const rect = par.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            nodes.push({ val: num, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        }

        if (nodes.length < 8) return;

        // Group into visual rows (nodes within 6px vertically = same row)
        const rows: {val: number, x: number, y: number}[][] = [];
        for (const n of nodes) {
            let placed = false;
            for (const row of rows) {
                if (Math.abs(row[0].y - n.y) <= 6) {
                    row.push(n);
                    placed = true;
                    break;
                }
            }
            if (!placed) rows.push([n]);
        }

        rows.sort((a, b) => a[0].y - b[0].y);
        for (const row of rows) row.sort((a, b) => a.x - b.x);

        let bids: {price: number, qty: number}[] = [];
        let asks: {price: number, qty: number}[] = [];

        for (const row of rows) {
            if (row.length < 4) continue;
            // Take last 4 values per row to skip any bar-width percentages
            const r = row.slice(row.length - 4);
            const [bp, bq, ap, aq] = [r[0].val, r[1].val, r[2].val, r[3].val];
            // Prices should be close (within 2% spread) and both quantities positive
            if (bp > 0 && bq > 0 && ap > 0 && aq > 0 && ap >= bp && (ap - bp) / ap < 0.02) {
                bids.push({price: bp, qty: bq});
                asks.push({price: ap, qty: aq});
                if (bids.length === 5) break;
            }
        }

        if (bids.length < 2 || asks.length < 2) return;

        bids.sort((a, b) => b.price - a.price);
        asks.sort((a, b) => a.price - b.price);

        let cumBid = 0;
        const cumBids = bids.map(b => { cumBid += b.qty; return { price: b.price, cumQty: cumBid, qty: b.qty }; });

        let cumAsk = 0;
        const cumAsks = asks.map(a => { cumAsk += a.qty; return { price: a.price, cumQty: cumAsk, qty: a.qty }; });

        renderDepthChart(cumBids, cumAsks, isDark);

    }, 1000);
}

function renderDepthChart(bids: {price:number, cumQty:number, qty:number}[], asks: {price:number, cumQty:number, qty:number}[], isDark: boolean) {
    const container = document.getElementById('ta-depth-chart-container');
    const svg = document.getElementById('ta-depth-svg');
    const pathBidArea = document.getElementById('ta-depth-area-bid');
    const pathBidLine = document.getElementById('ta-depth-line-bid');
    const pathAskArea = document.getElementById('ta-depth-area-ask');
    const pathAskLine = document.getElementById('ta-depth-line-ask');
    const hoverLayer = document.getElementById('ta-depth-hover-layer');
    const midPriceEl = document.getElementById('ta-depth-mid-price');
    const tooltip = document.getElementById('ta-depth-tooltip');

    if (!container || !svg || !pathBidArea || !pathBidLine || !pathAskArea || !pathAskLine || !hoverLayer || !midPriceEl) return;
    if (bids.length === 0 || asks.length === 0) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 180;

    const midPrice = (bids[0].price + asks[0].price) / 2;
    midPriceEl.innerText = `₹${midPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    const maxSpread = Math.max(midPrice - bids[bids.length - 1].price, asks[asks.length - 1].price - midPrice);
    if (maxSpread <= 0) return;
    
    const minP = midPrice - maxSpread;
    const maxP = midPrice + maxSpread;
    
    const maxQty = Math.max(bids[bids.length - 1].cumQty, asks[asks.length - 1].cumQty);
    if (maxQty <= 0) return;

    const priceToX = (p: number) => ((p - minP) / (maxP - minP)) * width;
    const qtyToY = (q: number) => height - (q / maxQty) * height;
    const midX = priceToX(midPrice);

    // === BIDS (green, left side) ===
    // bids sorted highest-price first; draw staircase from lowest price (left) to highest price (right)
    const bidPoints: {x:number, y:number, p:number, q:number, cq:number}[] = [];
    const revBids = [...bids].reverse(); // now lowest price first

    let bidPath = `M ${priceToX(revBids[0].price)} ${height} `; // start bottom-left of first stair
    revBids.forEach((b, i) => {
        const x = priceToX(b.price);
        const y = qtyToY(b.cumQty);
        bidPoints.push({x, y, p: b.price, q: b.qty, cq: b.cumQty});
        if (i === 0) {
            bidPath += `L ${x} ${y} `; // go up to stair top
        } else {
            // horizontal segment at previous height, then up
            bidPath += `L ${x} ${qtyToY(revBids[i-1].cumQty)} L ${x} ${y} `;
        }
    });
    // extend horizontal to mid and close bottom
    const lastBidX = priceToX(bids[0].price); // highest bid price = rightmost
    bidPath += `L ${midX} ${qtyToY(bids[0].cumQty)} L ${midX} ${height} Z`;

    pathBidArea.setAttribute('d', bidPath);
    // line only (no fill) — same stair path but without close
    let bidLine = `M ${priceToX(revBids[0].price)} ${qtyToY(revBids[0].cumQty)} `;
    revBids.forEach((b, i) => {
        if (i === 0) return;
        const x = priceToX(b.price);
        const y = qtyToY(b.cumQty);
        bidLine += `L ${x} ${qtyToY(revBids[i-1].cumQty)} L ${x} ${y} `;
    });
    bidLine += `L ${midX} ${qtyToY(bids[0].cumQty)}`;
    pathBidLine.setAttribute('d', bidLine);

    // === ASKS (red, right side) ===
    // asks sorted lowest price first
    const askPoints: {x:number, y:number, p:number, q:number, cq:number}[] = [];

    let askPath = `M ${midX} ${height} `; // start bottom at mid price
    asks.forEach((a, i) => {
        const x = priceToX(a.price);
        const y = qtyToY(a.cumQty);
        askPoints.push({x, y, p: a.price, q: a.qty, cq: a.cumQty});
        if (i === 0) {
            askPath += `L ${midX} ${y} L ${x} ${y} `; // up then right
        } else {
            askPath += `L ${x} ${qtyToY(asks[i-1].cumQty)} L ${x} ${y} `;
        }
    });
    // close at bottom-right
    askPath += `L ${priceToX(maxP)} ${qtyToY(asks[asks.length-1].cumQty)} L ${priceToX(maxP)} ${height} Z`;

    pathAskArea.setAttribute('d', askPath);
    let askLine = `M ${midX} ${qtyToY(asks[0].cumQty)} `;
    asks.forEach((a, i) => {
        if (i === 0) return;
        const x = priceToX(a.price);
        askLine += `L ${x} ${qtyToY(asks[i-1].cumQty)} L ${x} ${qtyToY(a.cumQty)} `;
    });
    askLine += `L ${priceToX(maxP)} ${qtyToY(asks[asks.length-1].cumQty)}`;
    pathAskLine.setAttribute('d', askLine);

    hoverLayer.innerHTML = '';
    const allPts = [...bidPoints.map(p=>({...p, type:'bid'})), ...askPoints.map(p=>({...p, type:'ask'}))];
    
    allPts.forEach(pt => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const segWidth = width / (allPts.length + 1); 
        rect.setAttribute('x', `${pt.x - segWidth/2}`);
        rect.setAttribute('y', '0');
        rect.setAttribute('width', `${segWidth}`);
        rect.setAttribute('height', `${height}`);
        rect.setAttribute('fill', 'transparent');
        rect.style.cursor = 'crosshair';
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${pt.x}`);
        circle.setAttribute('cy', `${pt.y}`);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', isDark ? '#1e1e24' : '#fff');
        circle.setAttribute('stroke', pt.type === 'bid' ? '#00d09c' : '#eb5b3c');
        circle.setAttribute('stroke-width', '2');
        circle.style.opacity = '0';
        circle.style.transition = 'opacity 0.1s';
        
        rect.addEventListener('mouseover', (e) => {
            circle.style.opacity = '1';
            if (tooltip) {
                const color = pt.type === 'bid' ? '#00d09c' : '#eb5b3c';
                const label = pt.type === 'bid' ? 'Buy' : 'Sell';
                tooltip.innerHTML = `
                    <div style="color:#7b809a; margin-bottom:4px;">${label} Price: <strong style="color:#fff;">₹${pt.p.toLocaleString(undefined, {minimumFractionDigits:2})}</strong></div>
                    <div style="font-size:12px; color:${color}">Volume: ${pt.q.toLocaleString()}</div>
                    <div style="font-size:12px; font-weight:bold; color:${color}">Cumulative: ${pt.cq.toLocaleString()}</div>
                `;
                tooltip.style.display = 'block';
                tooltip.style.opacity = '1';
                
                const svgRect = svg.getBoundingClientRect();
                const ttX = svgRect.left + pt.x + window.scrollX;
                const ttY = svgRect.top + pt.y + window.scrollY;
                tooltip.style.left = `${ttX}px`;
                tooltip.style.top = `${ttY}px`;
            }
        });
        rect.addEventListener('mouseout', () => {
            circle.style.opacity = '0';
            if (tooltip) {
                tooltip.style.opacity = '0';
                setTimeout(() => { if (tooltip.style.opacity === '0') tooltip.style.display = 'none'; }, 200);
            }
        });
        
        hoverLayer.appendChild(circle);
        hoverLayer.appendChild(rect);
    });
}

function injectPricePrediction() {
    if (!window.location.hostname.includes('groww.in')) return;
    if (document.getElementById('ta-pred-widget')) return;

    // Wait for Market Depth Visualizer to exist first
    const depthWidget = document.getElementById('ta-depth-widget');
    if (!depthWidget) return;

    const isDark = document.body.getAttribute('data-theme') === 'dark'
        || document.documentElement.classList.contains('dark-mode')
        || window.getComputedStyle(document.body).backgroundColor === 'rgb(18, 18, 18)'
        || window.getComputedStyle(document.body).backgroundColor === 'rgb(30, 30, 36)';

    const bg = isDark ? '#1e1e24' : '#fff';
    const border = isDark ? '#2b2b36' : '#e3e6e8';
    const textColor = isDark ? '#e0e0e0' : '#44475b';
    const subtleColor = isDark ? '#7b809a' : '#aaa';

    const widget = document.createElement('div');
    widget.id = 'ta-pred-widget';
    widget.style.cssText = `margin: 0 0 24px 0; padding: 20px; background: ${bg}; border-radius: 12px; border: 1px solid ${border}; font-family: inherit; box-shadow: 0 1px 4px rgba(0,0,0,0.04); position: relative;`;

    widget.innerHTML = `
        <div style="font-size:16px; font-weight:500; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; color:${textColor}">
            <span>📈 Price Prediction <span style="font-size:11px; color:${subtleColor}; font-weight:400;">(Order Book Analysis)</span></span>
            <span id="ta-pred-signal" style="font-size:12px; padding:3px 10px; border-radius:20px; font-weight:600;"></span>
        </div>
        <div style="font-size:11px; color:${subtleColor}; margin-bottom:16px;">Based on live Order Book Imbalance · Next 10 minutes forecast</div>
        <div style="position:relative; height:160px; width:100%;" id="ta-pred-chart-container">
            <svg id="ta-pred-svg" width="100%" height="100%" style="overflow:visible; display:block;">
                <defs>
                    <linearGradient id="ta-pred-grad-up" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00d09c" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="#00d09c" stop-opacity="0.0"/>
                    </linearGradient>
                    <linearGradient id="ta-pred-grad-down" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#eb5b3c" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="#eb5b3c" stop-opacity="0.0"/>
                    </linearGradient>
                </defs>
                <!-- confidence band area -->
                <path id="ta-pred-band" fill="url(#ta-pred-grad-up)" d=""/>
                <!-- predicted line (dashed) -->
                <path id="ta-pred-line" fill="none" stroke="#00d09c" stroke-width="2.5" stroke-dasharray="6,4" stroke-linecap="round" d=""/>
                <!-- current price anchor line -->
                <line id="ta-pred-anchor" x1="0" y1="0" x2="0" y2="0" stroke="${subtleColor}" stroke-width="1" stroke-dasharray="3,3"/>
                <!-- hover layer -->
                <g id="ta-pred-hover-layer"></g>
            </svg>
            <!-- y-axis price labels -->
            <div id="ta-pred-labels" style="position:absolute; top:0; right:0; height:100%; display:flex; flex-direction:column; justify-content:space-between; pointer-events:none; padding:4px 0;"></div>
        </div>
        <div id="ta-pred-summary" style="margin-top:14px; display:flex; gap:20px; flex-wrap:wrap;"></div>
    `;

    // Insert right after depth widget
    if (depthWidget.parentNode) {
        depthWidget.parentNode.insertBefore(widget, depthWidget.nextSibling);
    }

    // Create tooltip
    let predTooltip = document.getElementById('ta-pred-tooltip');
    if (!predTooltip) {
        predTooltip = document.createElement('div');
        predTooltip.id = 'ta-pred-tooltip';
        predTooltip.style.cssText = 'position:absolute; display:none; background:#1a1a2e; color:#fff; padding:10px 14px; border-radius:8px; font-size:12px; pointer-events:none; z-index:10001; box-shadow:0 4px 16px rgba(0,0,0,0.3); white-space:nowrap; border:1px solid #3c3c5a; transform:translate(-50%,-110%); font-family:inherit;';
        document.body.appendChild(predTooltip);
    }

    setInterval(() => {
        const predWidget = document.getElementById('ta-pred-widget');
        if (!predWidget) return;

        // ---- Get current price ----
        let currentPrice = 0;
        const allEls2 = document.querySelectorAll('span, div');
        for (let i = 0; i < allEls2.length; i++) {
            const el = allEls2[i] as HTMLElement;
            if (el.children.length === 0 && el.innerText) {
                const txt = el.innerText.trim().replace(/[₹,]/g, '');
                const n = parseFloat(txt);
                if (!isNaN(n) && n > 10 && window.getComputedStyle(el).fontSize > '20px') {
                    currentPrice = n;
                    break;
                }
            }
        }
        if (currentPrice <= 0) return;

        // ---- Parse market depth for OBI ----
        let bidPriceEl2: HTMLElement | null = null;
        const allDomEls = document.querySelectorAll('*');
        for (let i = 0; i < allDomEls.length; i++) {
            const el = allDomEls[i] as HTMLElement;
            if (!el.children.length && el.innerText && el.innerText.trim() === 'Bid Price') {
                bidPriceEl2 = el;
                break;
            }
        }
        if (!bidPriceEl2) return;

        let section2: HTMLElement | null = bidPriceEl2;
        for (let up = 0; up < 12; up++) {
            if (!section2) break;
            if (section2.innerText && section2.innerText.includes('Ask Price')) break;
            section2 = section2.parentElement;
        }
        if (!section2 || !section2.innerText.includes('Ask Price')) return;

        const nodes2: {val: number, x: number, y: number}[] = [];
        const tw2 = document.createTreeWalker(section2, NodeFilter.SHOW_TEXT);
        let tn2: Node | null;
        while ((tn2 = tw2.nextNode())) {
            const raw2 = (tn2.textContent || '').trim().replace(/,/g, '');
            const num2 = parseFloat(raw2);
            if (isNaN(num2) || num2 <= 0) continue;
            const par2 = tn2.parentElement as HTMLElement;
            if (!par2) continue;
            const rect2 = par2.getBoundingClientRect();
            if (rect2.width === 0 || rect2.height === 0) continue;
            nodes2.push({ val: num2, x: rect2.left + rect2.width / 2, y: rect2.top + rect2.height / 2 });
        }

        if (nodes2.length < 8) return;

        const rows2: {val:number, x:number, y:number}[][] = [];
        for (const n of nodes2) {
            let placed = false;
            for (const row of rows2) {
                if (Math.abs(row[0].y - n.y) <= 6) { row.push(n); placed = true; break; }
            }
            if (!placed) rows2.push([n]);
        }
        rows2.sort((a, b) => a[0].y - b[0].y);
        for (const row of rows2) row.sort((a, b) => a.x - b.x);

        let totalBidQty = 0, totalAskQty = 0;
        let avgBidPrice = 0, avgAskPrice = 0;
        let dataRows = 0;

        for (const row of rows2) {
            if (row.length < 4) continue;
            const r = row.slice(row.length - 4);
            const [bp, bq, ap, aq] = [r[0].val, r[1].val, r[2].val, r[3].val];
            if (bp > 0 && bq > 0 && ap > 0 && aq > 0 && ap >= bp && (ap - bp) / ap < 0.02) {
                totalBidQty += bq;
                totalAskQty += aq;
                avgBidPrice += bp;
                avgAskPrice += ap;
                dataRows++;
                if (dataRows === 5) break;
            }
        }

        if (dataRows === 0) return;
        avgBidPrice /= dataRows;
        avgAskPrice /= dataRows;

        // ---- OBI Calculation ----
        const obi = (totalBidQty - totalAskQty) / (totalBidQty + totalAskQty); // -1 to +1
        const spread = avgAskPrice - avgBidPrice;
        const spreadPct = spread / currentPrice;
        // Price velocity: how many rupees per minute based on OBI strength
        const priceVelocityPerMin = obi * currentPrice * 0.0012; // ~0.12% max per min at full imbalance
        const signalStrength = Math.abs(obi);
        const isUp = obi > 0;

        // ---- Generate 10 prediction points ----
        const MINS = 10;
        const predictedPrices: number[] = [currentPrice];
        const upperBand: number[] = [currentPrice];
        const lowerBand: number[] = [currentPrice];

        for (let m = 1; m <= MINS; m++) {
            // Mean reversion: velocity decays as time goes on
            const decayFactor = Math.exp(-m * 0.15);
            const meanMove = priceVelocityPerMin * m * decayFactor;
            const uncertainty = currentPrice * 0.0015 * Math.sqrt(m); // uncertainty grows with sqrt(time)

            predictedPrices.push(currentPrice + meanMove);
            upperBand.push(currentPrice + meanMove + uncertainty);
            lowerBand.push(currentPrice + meanMove - uncertainty);
        }

        // ---- Render ----
        const container = document.getElementById('ta-pred-chart-container');
        const svg = document.getElementById('ta-pred-svg') as unknown as SVGSVGElement;
        const pathLine = document.getElementById('ta-pred-line');
        const pathBand = document.getElementById('ta-pred-band');
        const anchor = document.getElementById('ta-pred-anchor');
        const hoverLayer = document.getElementById('ta-pred-hover-layer');
        const labelsDiv = document.getElementById('ta-pred-labels');
        const signalEl = document.getElementById('ta-pred-signal');
        const summaryEl = document.getElementById('ta-pred-summary');

        if (!container || !pathLine || !pathBand || !anchor || !hoverLayer || !labelsDiv) return;

        const W = container.clientWidth || 400;
        const H = container.clientHeight || 160;

        // Price range for Y axis
        const allPrices = [...predictedPrices, ...upperBand, ...lowerBand];
        const minY = Math.min(...allPrices) * 0.9998;
        const maxY = Math.max(...allPrices) * 1.0002;
        const prToY = (p: number) => H - ((p - minY) / (maxY - minY)) * H;
        const minToX = (m: number) => (m / MINS) * W;

        // Draw line
        let dLine = '';
        predictedPrices.forEach((p, i) => {
            dLine += `${i === 0 ? 'M' : 'L'} ${minToX(i).toFixed(1)} ${prToY(p).toFixed(1)} `;
        });
        pathLine.setAttribute('d', dLine);
        pathLine.setAttribute('stroke', isUp ? '#00d09c' : '#eb5b3c');
        pathLine.setAttribute('stroke-dasharray', isUp ? '6,4' : '4,4');

        // Draw confidence band (upper + lower outline)
        let dBand = `M ${minToX(0).toFixed(1)} ${prToY(upperBand[0]).toFixed(1)} `;
        for (let i = 1; i <= MINS; i++) dBand += `L ${minToX(i).toFixed(1)} ${prToY(upperBand[i]).toFixed(1)} `;
        for (let i = MINS; i >= 0; i--) dBand += `L ${minToX(i).toFixed(1)} ${prToY(lowerBand[i]).toFixed(1)} `;
        dBand += 'Z';
        pathBand.setAttribute('d', dBand);
        pathBand.setAttribute('fill', isUp ? 'url(#ta-pred-grad-up)' : 'url(#ta-pred-grad-down)');

        // Anchor line (current price horizontal)
        const anchorY = prToY(currentPrice).toFixed(1);
        anchor.setAttribute('x1', '0'); anchor.setAttribute('y1', anchorY);
        anchor.setAttribute('x2', W.toString()); anchor.setAttribute('y2', anchorY);

        // Update gradient colors
        const gradUp = document.getElementById('ta-pred-grad-up');
        const gradDown = document.getElementById('ta-pred-grad-down');
        if (!isUp && gradDown) {
            pathBand.setAttribute('fill', 'url(#ta-pred-grad-down)');
        }

        // Y-axis labels
        labelsDiv.innerHTML = '';
        [maxY, (maxY+minY)/2, minY].forEach(p => {
            const lbl = document.createElement('div');
            lbl.style.cssText = `font-size:10px; color:${subtleColor}; text-align:right; padding-right:4px; line-height:1;`;
            lbl.innerText = `₹${p.toFixed(2)}`;
            labelsDiv.appendChild(lbl);
        });

        // Signal badge
        if (signalEl) {
            const sLabel = signalStrength > 0.5 ? (isUp ? '🟢 Strong Buy' : '🔴 Strong Sell') :
                           signalStrength > 0.2 ? (isUp ? '🟢 Buy' : '🔴 Sell') : '🟡 Neutral';
            const sBg = signalStrength > 0.2 ? (isUp ? 'rgba(0,208,156,0.15)' : 'rgba(235,91,60,0.15)') : 'rgba(255,193,7,0.15)';
            const sC = signalStrength > 0.2 ? (isUp ? '#00d09c' : '#eb5b3c') : '#ffc107';
            signalEl.innerText = sLabel;
            signalEl.style.background = sBg;
            signalEl.style.color = sC;
            signalEl.style.border = `1px solid ${sC}`;
        }

        // Summary strip
        if (summaryEl) {
            const finalPred = predictedPrices[MINS];
            const changePct = ((finalPred - currentPrice) / currentPrice * 100).toFixed(2);
            const changeSign = finalPred >= currentPrice ? '+' : '';
            const obiPct = (obi * 100).toFixed(1);
            summaryEl.innerHTML = `
                <div style="font-size:12px; color:${subtleColor}">OBI Score <strong style="color:${isUp?'#00d09c':'#eb5b3c'}">${obiPct}%</strong></div>
                <div style="font-size:12px; color:${subtleColor}">10-min Target <strong style="color:${isUp?'#00d09c':'#eb5b3c'}">₹${finalPred.toFixed(2)} (${changeSign}${changePct}%)</strong></div>
                <div style="font-size:12px; color:${subtleColor}">Buy Vol <strong style="color:#00d09c">${totalBidQty.toLocaleString()}</strong> · Sell Vol <strong style="color:#eb5b3c">${totalAskQty.toLocaleString()}</strong></div>
            `;
        }

        // Hover dots
        hoverLayer.innerHTML = '';
        const svgEl = document.getElementById('ta-pred-svg');
        predictedPrices.forEach((price, m) => {
            if (m === 0) return; // skip anchor point
            const cx = minToX(m);
            const cy = prToY(price);
            const upB = upperBand[m];
            const loB = lowerBand[m];

            // Invisible hit rect
            const hitW = W / MINS;
            const hitRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            hitRect.setAttribute('x', `${cx - hitW/2}`);
            hitRect.setAttribute('y', '0');
            hitRect.setAttribute('width', `${hitW}`);
            hitRect.setAttribute('height', `${H}`);
            hitRect.setAttribute('fill', 'transparent');
            hitRect.style.cursor = 'crosshair';

            // Dot
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', `${cx}`);
            dot.setAttribute('cy', `${cy}`);
            dot.setAttribute('r', '5');
            dot.setAttribute('fill', isDark ? '#1e1e24' : '#fff');
            dot.setAttribute('stroke', isUp ? '#00d09c' : '#eb5b3c');
            dot.setAttribute('stroke-width', '2.5');
            dot.style.opacity = '0';
            dot.style.transition = 'opacity 0.1s';

            // Crosshair vertical line
            const crossV = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            crossV.setAttribute('x1', `${cx}`); crossV.setAttribute('x2', `${cx}`);
            crossV.setAttribute('y1', '0'); crossV.setAttribute('y2', `${H}`);
            crossV.setAttribute('stroke', isDark ? '#444' : '#ddd');
            crossV.setAttribute('stroke-width', '1');
            crossV.setAttribute('stroke-dasharray', '3,3');
            crossV.style.opacity = '0';
            crossV.style.transition = 'opacity 0.1s';

            hitRect.addEventListener('mouseover', () => {
                dot.style.opacity = '1';
                crossV.style.opacity = '1';
                const tt = document.getElementById('ta-pred-tooltip');
                if (tt && svgEl) {
                    const svgRect3 = svgEl.getBoundingClientRect();
                    const changeAmt = (price - currentPrice).toFixed(2);
                    const changePctHov = ((price - currentPrice) / currentPrice * 100).toFixed(2);
                    const changeSign = price >= currentPrice ? '+' : '';
                    const col = price >= currentPrice ? '#00d09c' : '#eb5b3c';
                    tt.innerHTML = `
                        <div style="font-weight:600; margin-bottom:6px; color:${col}">+${m} min</div>
                        <div style="margin-bottom:3px;">Expected: <strong style="color:${col}">₹${price.toFixed(2)}</strong></div>
                        <div style="margin-bottom:3px; font-size:11px; color:#aaa;">Change: <span style="color:${col}">${changeSign}₹${changeAmt} (${changeSign}${changePctHov}%)</span></div>
                        <div style="font-size:10px; color:#888; border-top:1px solid #333; padding-top:4px; margin-top:4px;">
                            Range: ₹${loB.toFixed(2)} – ₹${upB.toFixed(2)}
                        </div>
                    `;
                    tt.style.display = 'block';
                    tt.style.opacity = '1';
                    tt.style.left = `${svgRect3.left + cx + window.scrollX}px`;
                    tt.style.top = `${svgRect3.top + cy + window.scrollY}px`;
                }
            });
            hitRect.addEventListener('mouseout', () => {
                dot.style.opacity = '0';
                crossV.style.opacity = '0';
                const tt = document.getElementById('ta-pred-tooltip');
                if (tt) { tt.style.opacity = '0'; setTimeout(() => { if (tt.style.opacity === '0') tt.style.display = 'none'; }, 200); }
            });

            hoverLayer.appendChild(crossV);
            hoverLayer.appendChild(dot);
            hoverLayer.appendChild(hitRect);
        });

    }, 1500);
}

function injectMutualFundProjector() {
    const bodyText = document.body.innerText;
    
    let pageCv: number | null = null;
    const currMatch = bodyText.match(/Current value\s*₹?([0-9,.]+)/i);
    if (currMatch) pageCv = parseFloat(currMatch[1].replace(/,/g, ''));
    
    let pageXirr: number | null = null;
    const xirrMatch = bodyText.match(/XIRR(?:[\s\nv^]|\(Active\))*([+\-0-9.]+)%/i);
    if (xirrMatch) pageXirr = parseFloat(xirrMatch[1]);

    if (document.getElementById('ta-mf-widget')) {
        let changed = false;
        if (pageCv !== null) {
            const cvEl = document.getElementById('ta-mf-curr');
            if (cvEl && parseFloat(cvEl.getAttribute('data-val') || '0') !== pageCv) {
                cvEl.setAttribute('data-val', pageCv.toString());
                cvEl.innerText = `₹${pageCv.toLocaleString()}`;
                changed = true;
            }
        }
        if (pageXirr !== null) {
            const xirrEl = document.getElementById('ta-mf-xirr');
            if (xirrEl && parseFloat(xirrEl.getAttribute('data-val') || '0') !== pageXirr) {
                xirrEl.setAttribute('data-val', pageXirr.toString());
                xirrEl.innerText = `${pageXirr}%`;
                xirrEl.style.color = pageXirr < 0 ? '#eb5b3c' : '#00d09c';
                changed = true;
            }
        }
        if (changed) {
            const yearSlider = document.getElementById('ta-mf-years');
            if (yearSlider) yearSlider.dispatchEvent(new Event('input'));
        }
        return;
    }
    
    const headings = Array.from(document.querySelectorAll('div, h1, h2, span, p')).filter(el => {
        return (el as HTMLElement).innerText && (el as HTMLElement).innerText.match(/^Investments\s*\([0-9]+\)$/i);
    });
    
    let insertPoint = headings.length > 0 ? headings[headings.length - 1] : null;
    if (!insertPoint) return;

    let currentValue = pageCv || 0;
    let investedValue = 0;
    let xirr = pageXirr || 12;
    
    const invMatch = bodyText.match(/Invested value\s*₹?([0-9,.]+)/i);
    if (invMatch) investedValue = parseFloat(invMatch[1].replace(/,/g, ''));
    
    let sipValue = 0;
    const sipMatch = bodyText.match(/(?:Monthly SIP|SIP amount|Total SIP).*?₹?([0-9,.]+)/i);
    if (sipMatch) {
        sipValue = parseFloat(sipMatch[1].replace(/,/g, ''));
    }

    const widget = document.createElement('div');
    widget.id = 'ta-mf-widget';
    widget.style.cssText = "margin: 0 0 24px 0; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e3e6e8; font-family: inherit; color: #44475b; box-shadow: 0 1px 4px rgba(0,0,0,0.04); position: relative;";
    
    const isDark = document.body.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark-mode') || window.getComputedStyle(document.body).backgroundColor === 'rgb(18, 18, 18)' || window.getComputedStyle(document.body).backgroundColor === 'rgb(30, 30, 36)';
    if (isDark) {
        widget.style.background = '#1e1e24';
        widget.style.borderColor = '#2b2b36';
        widget.style.color = '#e0e0e0';
    }

    widget.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 15px; display: flex; justify-content: space-between;">
            <span>Wealth Projector (SIP + Compounding)</span>
            <span style="font-size: 12px; color: #7b809a; font-weight: 400;">Powered by AI ⚡</span>
        </div>
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px; display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e3e6e8;">
                    <div style="font-size: 13px; color: #7b809a;">Current Value (₹)</div>
                    <div id="ta-mf-curr" data-val="${currentValue}" style="font-size: 14px; font-weight: 600;">₹${currentValue.toLocaleString()}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e3e6e8;">
                    <div style="font-size: 13px; color: #7b809a; display: flex; align-items: center; gap: 6px;">
                        Monthly SIP (₹) 
                        <span id="ta-mf-edit-sip" style="cursor: pointer; font-size: 11px; color: #5367ff; text-decoration: underline;">Edit</span>
                    </div>
                    <div id="ta-mf-sip-display" style="font-size: 14px; font-weight: 600;">₹${sipValue.toLocaleString()}</div>
                    <input type="number" id="ta-mf-sip-input" value="${sipValue}" style="display: none; width: 80px; padding: 4px; border: 1px solid #00d09c; border-radius: 4px; font-size: 13px; outline: none; text-align: right; background: transparent; color: inherit;">
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e3e6e8;">
                    <div style="font-size: 13px; color: #7b809a;">Expected Return / XIRR (%)</div>
                    <div id="ta-mf-xirr" data-val="${xirr}" style="font-size: 14px; font-weight: 600; color: ${xirr < 0 ? '#eb5b3c' : '#00d09c'};">${xirr}%</div>
                </div>
                <div style="margin-top: 10px;">
                    <div style="font-size: 13px; color: #7b809a; margin-bottom: 8px; display: flex; justify-content: space-between;">
                        <span>Time Horizon:</span> <span id="ta-mf-year-val" style="font-weight:600; color: #5367ff;">10 Years</span>
                    </div>
                    <input type="range" id="ta-mf-years" min="1" max="30" value="10" style="width: 100%; accent-color: #00d09c; cursor: pointer;">
                </div>
            </div>
            
            <div style="flex: 2; min-width: 300px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
                    <div style="font-size: 13px; color: #7b809a;">Projected Wealth</div>
                    <div id="ta-mf-projected-val" style="font-size: 26px; font-weight: 600; color: #00d09c;">₹0</div>
                </div>
                
                <div style="flex: 1; position: relative; height: 160px;" id="ta-mf-chart-container">
                    <svg id="ta-mf-svg" width="100%" height="100%" style="overflow: visible; display: block; border-bottom: 1px solid #e3e6e8;">
                        <defs>
                            <linearGradient id="ta-mf-grad-green" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#00d09c" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#00d09c" stop-opacity="0.0"/>
                            </linearGradient>
                            <linearGradient id="ta-mf-grad-red" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#eb5b3c" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#eb5b3c" stop-opacity="0.0"/>
                            </linearGradient>
                        </defs>
                        <path id="ta-mf-area" fill="url(#ta-mf-grad-green)" d=""></path>
                        <path id="ta-mf-line" fill="none" stroke="#00d09c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d=""></path>
                        <g id="ta-mf-hover-layer"></g>
                    </svg>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #7b809a; margin-top: 6px;">
                    <span>Year 1</span>
                    <span id="ta-mf-chart-end-label">Year 10</span>
                </div>
            </div>
        </div>
    `;

    if (insertPoint.parentNode) {
        insertPoint.parentNode.insertBefore(widget, insertPoint);
    }

    let tooltip = document.getElementById('ta-mf-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'ta-mf-tooltip';
        tooltip.style.cssText = 'position: absolute; display: none; background: #2b2b36; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; pointer-events: none; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); white-space: nowrap; transition: opacity 0.2s; opacity: 0; font-family: inherit; border: 1px solid #3c3c4a; transform: translate(-50%, -100%); margin-top: -15px;';
        document.body.appendChild(tooltip);
    }

    const editBtn = document.getElementById('ta-mf-edit-sip');
    const sipDisplay = document.getElementById('ta-mf-sip-display');
    const sipInput = document.getElementById('ta-mf-sip-input') as HTMLInputElement;
    
    if (editBtn && sipDisplay && sipInput) {
        editBtn.addEventListener('click', () => {
            if (sipInput.style.display === 'none') {
                sipDisplay.style.display = 'none';
                sipInput.style.display = 'block';
                sipInput.focus();
                editBtn.innerText = 'Save';
            } else {
                sipDisplay.style.display = 'block';
                sipInput.style.display = 'none';
                sipValue = parseFloat(sipInput.value) || 0;
                sipDisplay.innerText = `₹${sipValue.toLocaleString()}`;
                editBtn.innerText = 'Edit';
                updateMfChart();
            }
        });
        sipInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') editBtn.click();
        });
    }

    const updateMfChart = () => {
        const cvEl = document.getElementById('ta-mf-curr');
        const xirrEl = document.getElementById('ta-mf-xirr');
        
        const cv = cvEl ? parseFloat(cvEl.getAttribute('data-val') || '0') : 0;
        const sip = sipValue; 
        let rate = xirrEl ? parseFloat(xirrEl.getAttribute('data-val') || '0') : 0;
        
        const years = parseInt((document.getElementById('ta-mf-years') as HTMLInputElement).value) || 10;
        
        const yearValLabel = document.getElementById('ta-mf-year-val');
        if (yearValLabel) yearValLabel.innerText = `${years} Years`;
        
        const endLabel = document.getElementById('ta-mf-chart-end-label');
        if (endLabel) endLabel.innerText = `Year ${years}`;
        
        let r = rate / 100 / 12;
        if (r === 0) r = 0.000001; 
        
        const container = document.getElementById('ta-mf-chart-container');
        const svg = document.getElementById('ta-mf-svg');
        const line = document.getElementById('ta-mf-line');
        const area = document.getElementById('ta-mf-area');
        const hoverLayer = document.getElementById('ta-mf-hover-layer');
        if (!container || !svg || !line || !area || !hoverLayer) return;
        
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 160;
        
        let maxVal = cv;
        let minVal = cv;
        const dataPoints: number[] = [cv];
        
        for (let y = 1; y <= years; y++) {
            const n = y * 12;
            const projectedCV = cv * Math.pow(1 + r, n);
            const projectedSIP = sip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
            const total = projectedCV + projectedSIP;
            dataPoints.push(total);
            if (total > maxVal) maxVal = total;
            if (total < minVal) minVal = total;
        }
        
        const range = maxVal - minVal || 1;
        
        let dLine = "";
        let dArea = "";
        
        const pointsXY: {x:number, y:number, val:number}[] = [];
        
        dataPoints.forEach((val, i) => {
            const x = (i / years) * width;
            const y = height - ((val - minVal) / range) * height;
            pointsXY.push({x, y, val});
            
            if (i === 0) {
                dLine += `M ${x} ${y} `;
                dArea += `M ${x} ${height} L ${x} ${y} `;
            } else {
                dLine += `L ${x} ${y} `;
                dArea += `L ${x} ${y} `;
            }
        });
        
        dArea += `L ${width} ${height} Z`;
        
        line.setAttribute('d', dLine);
        area.setAttribute('d', dArea);
        
        const isNegative = rate < 0;
        const color = isNegative ? '#eb5b3c' : '#00d09c';
        line.setAttribute('stroke', color);
        area.setAttribute('fill', isNegative ? 'url(#ta-mf-grad-red)' : 'url(#ta-mf-grad-green)');
        
        hoverLayer.innerHTML = '';
        pointsXY.forEach((pt, idx) => {
            if (idx === 0) return;
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            const segWidth = width / years;
            rect.setAttribute('x', `${pt.x - segWidth/2}`);
            rect.setAttribute('y', '0');
            rect.setAttribute('width', `${segWidth}`);
            rect.setAttribute('height', `${height}`);
            rect.setAttribute('fill', 'transparent');
            rect.style.cursor = 'pointer';
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', `${pt.x}`);
            circle.setAttribute('cy', `${pt.y}`);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', isDark ? '#1e1e24' : '#fff');
            circle.setAttribute('stroke', color);
            circle.setAttribute('stroke-width', '2');
            circle.style.opacity = '0';
            circle.style.transition = 'opacity 0.2s';
            
            rect.addEventListener('mouseover', (e) => {
                circle.style.opacity = '1';
                if (tooltip) {
                    tooltip.innerHTML = `<div style="color:#7b809a; margin-bottom:2px;">Year ${idx}</div><div style="font-size:14px; font-weight:bold; color:${color}">₹${pt.val.toLocaleString(undefined, {maximumFractionDigits:0})}</div>`;
                    tooltip.style.display = 'block';
                    tooltip.style.opacity = '1';
                    
                    const svgRect = svg.getBoundingClientRect();
                    tooltip.style.left = (svgRect.left + pt.x) + 'px';
                    tooltip.style.top = (svgRect.top + pt.y) + 'px';
                }
            });
            rect.addEventListener('mouseout', () => {
                circle.style.opacity = '0';
                if (tooltip) {
                    tooltip.style.opacity = '0';
                    setTimeout(() => { if (tooltip.style.opacity === '0') tooltip.style.display = 'none'; }, 200);
                }
            });
            
            hoverLayer.appendChild(circle);
            hoverLayer.appendChild(rect);
        });
        
        const finalVal = dataPoints[dataPoints.length - 1];
        const projectedValLabel = document.getElementById('ta-mf-projected-val');
        if (projectedValLabel) {
            projectedValLabel.innerText = `₹${finalVal.toLocaleString(undefined, {maximumFractionDigits:0})}`;
            projectedValLabel.style.color = color;
        }
    };

    const yearSlider = document.getElementById('ta-mf-years');
    if (yearSlider) yearSlider.addEventListener('input', updateMfChart);
    
    window.addEventListener('resize', updateMfChart);

    setTimeout(updateMfChart, 10);
}

function parsePositions(): PositionData[] {
    const positions: PositionData[] = [];
    const allRows = Array.from(document.querySelectorAll('div, tr'));

    for (const row of allRows) {
        const hRow = row as HTMLElement;
        
        if (hRow.closest('#ta-positions-analyzer')) continue;

        const text = hRow.innerText;
        if (!text) continue;

        const rupeeMatches = text.match(/₹[0-9,.]+/g);
        
        // We only care about things that look like rows
        const hasRupees = rupeeMatches && rupeeMatches.length >= 2;
        
        if (!hasRupees) continue;

        if (rupeeMatches.length > 3) continue;

        if (text.includes('Company') && text.includes('Returns') && text.includes('Mkt price')) {
            continue;
        }

        const textBeforeRupees = text.split('₹')[0].trim();
        const parts = textBeforeRupees.split(/[\n\t\s]+/);
        if (parts.length === 0) continue;

        let qtyStr = parts[parts.length - 1];
        let qty = parseInt(qtyStr, 10);
        let company = '';
        
        if (isNaN(qty)) {
            qty = 0;
            company = parts.join(' ').trim();
        } else {
            parts.pop();
            company = parts.join(' ').trim();
        }

        let href = '';
        const linkEl = hRow.querySelector('a[href^="/stocks/"]');
        if (linkEl) {
            company = (linkEl as HTMLElement).innerText.trim();
            href = linkEl.getAttribute('href') || '';
        }

        if (!company || company.length < 3) continue;
        
        const lowerCo = company.toLowerCase();
        const ignoreList = ['others', 'mtf', 'stock screen', 'total return', 'positions analyzer', 'company', 'returns', 'position'];
        if (ignoreList.some(kw => lowerCo.includes(kw))) continue;

        const ticker = href
            ? href.replace('/stocks/', '').split('-')[0].toUpperCase()
            : company.split(' ')[0].toUpperCase();

        const parseRupee = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ''));
        const mktPrice = parseRupee(rupeeMatches[0] || '');
        const avgPrice = parseRupee(rupeeMatches[1] || '');

        if (isNaN(mktPrice)) continue;

        let returns = 0;
        if (rupeeMatches.length >= 3) {
            const lastRupee = rupeeMatches[rupeeMatches.length - 1];
            returns = parseRupee(lastRupee);
            const lastRupeeIdx = text.lastIndexOf(lastRupee);
            if (text.charAt(lastRupeeIdx - 1) === '-') returns = -returns;
        } else {
            returns = (mktPrice - avgPrice) * qty;
        }

        positions.push({ company, ticker, qty, mktPrice, avgPrice, returns });
    }

    const seen = new Set<string>();
    return positions.filter(p => {
        if (seen.has(p.company)) return false;
        seen.add(p.company);
        return true;
    });
}

let posRefreshInterval: ReturnType<typeof setInterval> | null = null;
let autoExitInterval: ReturnType<typeof setInterval> | null = null;
let hasAutoExitedToday = false;

function detectDurationType(): string {
    const bodyText = document.body.innerText;
    if (bodyText.match(/Equity Intraday/i)) return 'Intraday';
    return 'Swing';
}

function injectPositionsAnalyzer() {
    if (document.getElementById('ta-positions-analyzer')) return;

    // Target the right-side panel
    let targetEl: HTMLElement | null = null;
    const allEls = Array.from(document.querySelectorAll('div, section'));
    for (const el of allEls) {
        const hEl = el as HTMLElement;
        if (hEl.innerText && hEl.innerText.trim() === 'Select a stock to get started') {
            targetEl = hEl.parentElement as HTMLElement;
            break;
        }
    }
    if (!targetEl) {
        for (const el of allEls) {
            const hEl = el as HTMLElement;
            if (hEl.innerText && hEl.innerText.includes('Select a stock') && hEl.children.length <= 3) {
                targetEl = hEl as HTMLElement;
                break;
            }
        }
    }
    if (!targetEl) return;

    targetEl.innerHTML = '';
    targetEl.style.padding = '0';
    targetEl.style.overflow = 'auto';

    const widget = document.createElement('div');
    widget.id = 'ta-positions-analyzer';
    widget.style.cssText = `
        width: 100%;
        height: 100%;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        box-sizing: border-box;
        background: #fff;
        display: flex;
        flex-direction: column;
    `;

    widget.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            @keyframes ta-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
            @keyframes ta-fade-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
            .ta-pos-card {
                background: #fff;
                border: 1px solid #f0f2f5;
                border-radius: 10px;
                padding: 14px;
                transition: box-shadow 0.18s;
                animation: ta-fade-in 0.25s ease forwards;
                margin-bottom: 10px;
            }
            .ta-pos-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
            .ta-live-dot {
                width: 7px; height: 7px; border-radius: 50%; background: #00b386;
                display: inline-block; animation: ta-pulse 1.5s ease-in-out infinite;
            }
            @keyframes ta-pulse {
                0%,100%{opacity:1;transform:scale(1)}
                50%{opacity:0.5;transform:scale(0.8)}
            }
        </style>

        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 16px 12px; border-bottom:1px solid #f0f2f5; background:#fff; position:sticky; top:0; z-index:2;">
            <div style="font-size:14px; font-weight:700; color:#44475b;">Positions Analyzer</div>
            <div style="display:flex; align-items:center; gap:5px;">
                <div class="ta-live-dot"></div>
                <span style="font-size:11px; color:#00b386; font-weight:600;">Live</span>
            </div>
        </div>

        <!-- P&L Summary -->
        <div id="ta-pnl-banner" style="padding:16px; background:#f9fafb; border-bottom:1px solid #f0f2f5; flex-shrink:0;">
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:12px;">
                <div style="background:#fff; border:1px solid #f0f2f5; border-radius:8px; padding:10px 12px;">
                    <div style="font-size:10px; color:#9aa0a6; text-transform:uppercase; letter-spacing:0.6px; font-weight:600; margin-bottom:4px;">Realised</div>
                    <div id="ta-real-val" style="font-size:15px; font-weight:800; color:#44475b;">—</div>
                </div>
                <div style="background:#fff; border:1px solid #f0f2f5; border-radius:8px; padding:10px 12px; text-align:center;">
                    <div style="font-size:10px; color:#9aa0a6; text-transform:uppercase; letter-spacing:0.6px; font-weight:600; margin-bottom:4px;">Net P&L</div>
                    <div id="ta-total-pnl" style="font-size:16px; font-weight:800; color:#44475b;">—</div>
                </div>
                <div style="background:#fff; border:1px solid #f0f2f5; border-radius:8px; padding:10px 12px; text-align:right;">
                    <div style="font-size:10px; color:#9aa0a6; text-transform:uppercase; letter-spacing:0.6px; font-weight:600; margin-bottom:4px;">Unrealised</div>
                    <div id="ta-unreal-val" style="font-size:15px; font-weight:800; color:#44475b;">—</div>
                </div>
            </div>

            <!-- Stacked Bar -->
            <div style="width:100%; height:8px; border-radius:4px; background:#eef0f2; overflow:hidden; display:flex; margin-bottom:8px;">
                <div id="ta-bar-real" style="height:100%; width:0%; border-radius:4px 0 0 4px; transition:width 0.7s cubic-bezier(0.4,0,0.2,1);"></div>
                <div id="ta-bar-unreal" style="height:100%; width:0%; border-radius:0 4px 4px 0; transition:width 0.7s cubic-bezier(0.4,0,0.2,1);"></div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:4px; font-size:11px; color:#9aa0a6;">
                    <div style="width:8px;height:8px;border-radius:50%;background:#00b386;"></div>
                    Realised
                    <div style="width:8px;height:8px;border-radius:50%;background:#00b38660; margin-left:6px;"></div>
                    Unrealised
                </div>
                <div style="font-size:11px; color:#9aa0a6;">🎯 Hit Rate: <strong id="ta-hit-rate" style="color:#44475b;">—</strong></div>
            </div>
        </div>

        <!-- Loading -->
        <div id="ta-pos-loading" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px 0; gap:10px; flex:1;">
            <div style="width:26px;height:26px;border:3px solid #f0f2f5;border-top:3px solid #00b386;border-radius:50%;animation:ta-spin 0.8s linear infinite;"></div>
            <div style="font-size:12px; color:#9aa0a6; font-weight:500;">Fetching live analysis...</div>
        </div>

        <!-- Cards -->
        <div id="ta-pos-content" style="display:none; padding:12px; flex:1; overflow-y:auto;"></div>
    `;

    targetEl.appendChild(widget);

    // Inject Auto-Exit toggle programmatically into the header (bypasses Groww CSS resets)
    const headerEl = widget.querySelector('div[style*="sticky"]') as HTMLElement | null;
    if (headerEl) {
        const autoExitBox = document.createElement('div');
        autoExitBox.id = 'ta-auto-exit-box';
        autoExitBox.style.cssText = 'width:100%; margin-top:8px; background:#fdf2f2; border:1px dashed #fadcdc; border-radius:8px; padding:8px 12px; box-sizing:border-box; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition: background 0.2s, border-color 0.2s;';

        const autoExitLabel = document.createElement('div');
        autoExitLabel.style.cssText = 'display:flex; flex-direction:column; gap:2px;';
        autoExitLabel.innerHTML = `<div style="font-size:12px;font-weight:700;color:#c53030;">Auto-Square Off &#9889;</div><div style="font-size:10px;color:#c53030;opacity:0.8;">Exits all positions at 3:15 PM</div>`;

        // Right side: status badge + checkbox
        const rightSide = document.createElement('div');
        rightSide.style.cssText = 'display:flex; align-items:center; gap:8px;';

        const statusBadge = document.createElement('span');
        statusBadge.id = 'ta-auto-exit-status';
        statusBadge.style.cssText = 'font-size:11px; font-weight:800; padding:2px 7px; border-radius:10px; background:#e2e8f0; color:#718096; letter-spacing:0.5px;';
        statusBadge.innerText = 'OFF';

        const autoExitCb = document.createElement('input');
        autoExitCb.type = 'checkbox';
        autoExitCb.id = 'ta-auto-exit';
        autoExitCb.style.cssText = 'cursor:pointer; width:18px; height:18px; accent-color:#e53e3e; flex-shrink:0; display:block; visibility:visible; opacity:1;';

        rightSide.appendChild(statusBadge);
        rightSide.appendChild(autoExitCb);

        autoExitBox.appendChild(autoExitLabel);
        autoExitBox.appendChild(rightSide);

        const updateVisual = (checked: boolean) => {
            if (checked) {
                autoExitBox.style.background = '#fff5f5';
                autoExitBox.style.borderColor = '#fc8181';
                statusBadge.style.background = '#c53030';
                statusBadge.style.color = '#fff';
                statusBadge.innerText = 'ON';
            } else {
                autoExitBox.style.background = '#fdf2f2';
                autoExitBox.style.borderColor = '#fadcdc';
                statusBadge.style.background = '#e2e8f0';
                statusBadge.style.color = '#718096';
                statusBadge.innerText = 'OFF';
            }
        };

        autoExitCb.addEventListener('change', () => {
            updateVisual(autoExitCb.checked);
            chrome.storage.local.set({ taAutoExitEnabled: autoExitCb.checked });
        });

        autoExitBox.addEventListener('click', (e) => {
            if (e.target !== autoExitCb) autoExitCb.click();
        });

        // Change header to column layout
        headerEl.style.flexDirection = 'column';
        headerEl.style.alignItems = 'stretch';
        const headerTop = headerEl.firstElementChild as HTMLElement;
        if (headerTop) {
            headerTop.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;';
        }
        headerEl.appendChild(autoExitBox);

        // Warning note
        const warningNote = document.createElement('div');
        warningNote.style.cssText = 'margin-top:6px; display:flex; align-items:flex-start; gap:5px;';
        warningNote.innerHTML = `<span style="font-size:13px; line-height:1;">&#9888;</span><span style="font-size:10px; color:#b7791f; font-weight:500; line-height:1.4;">Positions page must remain open at 3:15 PM for Auto-Square Off to work.</span>`;
        headerEl.appendChild(warningNote);

        // Store updateVisual reference for use after storage load
        (autoExitCb as any)._updateVisual = updateVisual;
    }

    fetchAndRenderPositions();

    // Live refresh every 45 seconds
    if (posRefreshInterval) clearInterval(posRefreshInterval);
    posRefreshInterval = setInterval(() => {
        const existing = document.getElementById('ta-positions-analyzer');
        if (!existing) {
            if (posRefreshInterval) clearInterval(posRefreshInterval);
            return;
        }
        fetchAndRenderPositions();
    }, 45000);

    // Auto-Exit Logic
    const cb = document.getElementById('ta-auto-exit') as HTMLInputElement;
    if (cb) {
        chrome.storage.local.get(['taAutoExitEnabled', 'taLastAutoExitDate'], (res) => {
            if (res.taAutoExitEnabled) {
                cb.checked = true;
                if ((cb as any)._updateVisual) (cb as any)._updateVisual(true);
            }
            const todayStr = new Date().toLocaleDateString();
            hasAutoExitedToday = (res.taLastAutoExitDate === todayStr);
        });
    }

    if (autoExitInterval) clearInterval(autoExitInterval);
    autoExitInterval = setInterval(() => {
        const _cb = document.getElementById('ta-auto-exit') as HTMLInputElement;
        if (!_cb || !_cb.checked || hasAutoExitedToday) return;

        const now = new Date();
        if (now.getHours() === 15 && now.getMinutes() >= 15 && now.getMinutes() <= 16) {
            const divs = Array.from(document.querySelectorAll('div, button'));
            for (const div of divs) {
                const hDiv = div as HTMLElement;
                if (hDiv.innerText && hDiv.innerText.trim() === 'Exit all') {
                    hDiv.click();
                    hasAutoExitedToday = true;
                    chrome.storage.local.set({ taLastAutoExitDate: new Date().toLocaleDateString() });
                    
                    setTimeout(() => {
                        const popups = Array.from(document.querySelectorAll('div[role="dialog"] button, div[role="presentation"] button, button'));
                        for (const btn of popups) {
                            const btnText = (btn as HTMLElement).innerText?.toUpperCase() || '';
                            if (btnText === 'EXIT ALL' || btnText.includes('EXIT') || btnText.includes('SELL') || btnText.includes('CONFIRM')) {
                                (btn as HTMLElement).click();
                                break;
                            }
                        }
                    }, 500);
                    break;
                }
            }
        }
    }, 10000);
}

function fetchAndRenderPositions() {
    const loading = document.getElementById('ta-pos-loading');
    const content = document.getElementById('ta-pos-content');

    // Only show spinner on first load (content is empty)
    if (content && content.innerHTML.trim() === '') {
        if (loading) loading.style.display = 'flex';
        if (content) content.style.display = 'none';
    }

    const positions = parsePositions();
    let realisedPnl = 0;
    let unrealisedPnl = 0;
    let profitableCount = 0;
    const activePositions: PositionData[] = [];

    positions.forEach(p => {
        if (p.qty === 0) {
            realisedPnl += p.returns;
        } else {
            unrealisedPnl += p.returns;
            activePositions.push(p);
        }
        if (p.returns > 0) profitableCount++;
    });

    const hitRate = positions.length > 0 ? Math.round((profitableCount / positions.length) * 100) : 0;
    updateBanner(realisedPnl, unrealisedPnl, hitRate);

    if (activePositions.length === 0) {
        if (loading) loading.style.display = 'none';
        if (content) {
            content.innerHTML = `<div style="text-align:center;color:#9aa0a6;padding:24px 16px;font-size:13px;line-height:1.5;">
                No active positions to analyze.<br>Open a position to see analysis here.
            </div>`;
            content.style.display = 'block';
        }
        return;
    }

    // Auto-detect duration from page content
    const durationType = detectDurationType();

    const req: PositionsAnalysisRequest = {
        type: 'ANALYZE_POSITIONS',
        positions: activePositions,
        durationType: durationType
    };

    chrome.runtime.sendMessage(req, (response: PositionsAnalysisResponse) => {
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'block';

        if (!response || !response.success || !response.data) {
            if (content) content.innerHTML = `<div style="text-align:center;color:#9aa0a6;padding:24px;font-size:13px;">Analysis unavailable. Retrying shortly...</div>`;
            return;
        }
        renderCards(content, response, activePositions, durationType);
    });
}

function updateBanner(realisedPnl: number, unrealisedPnl: number, hitRate: number) {
    const fmt = (v: number) => (v >= 0 ? '+₹' : '-₹') + Math.abs(v).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const totalPnl = realisedPnl + unrealisedPnl;

    const totalColor = totalPnl >= 0 ? '#00b386' : '#eb5b3c';
    const realColor = realisedPnl >= 0 ? '#00b386' : '#eb5b3c';
    const unrealColor = unrealisedPnl >= 0 ? '#00b386' : '#eb5b3c';

    const realBg = realisedPnl >= 0 ? '#00b386' : '#eb5b3c';
    const unrealBg = unrealisedPnl >= 0 ? '#00b38640' : '#eb5b3c40';

    const absTotal = Math.abs(realisedPnl) + Math.abs(unrealisedPnl);
    const realPct = absTotal > 0 ? Math.abs(realisedPnl) / absTotal * 100 : 50;
    const unrealPct = absTotal > 0 ? Math.abs(unrealisedPnl) / absTotal * 100 : 50;

    const set = (id: string, val: string, color?: string) => {
        const el = document.getElementById(id) as HTMLElement;
        if (el) { el.innerText = val; if (color) el.style.color = color; }
    };
    const setStyle = (id: string, prop: string, val: string) => {
        const el = document.getElementById(id) as HTMLElement;
        if (el) (el.style as any)[prop] = val;
    };

    set('ta-total-pnl', fmt(totalPnl), totalColor);
    set('ta-real-val', fmt(realisedPnl), realColor);
    set('ta-unreal-val', fmt(unrealisedPnl), unrealColor);
    set('ta-hit-rate', hitRate + '%');

    setStyle('ta-bar-real', 'width', realPct + '%');
    setStyle('ta-bar-real', 'background', realBg);
    setStyle('ta-bar-unreal', 'width', unrealPct + '%');
    setStyle('ta-bar-unreal', 'background', unrealBg);
}

function renderCards(content: HTMLElement | null, response: any, activePositions: any[], durationType: string) {
    if (!content) return;

    let html = '';
    const durationLabel = durationType === 'Intraday' ? '⚡ Intraday' : '📊 Swing';

    html += `<div style="font-size:10px;color:#9aa0a6;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f2f5;">${durationLabel} Analysis · Auto-refreshes every 45s</div>`;

    for (const pos of response.data.positions) {
        const pData = activePositions.find(p => p.company === pos.company);
        const mktPrice = pData ? pData.mktPrice : 0;

        let recColor = '#9aa0a6', recBg = '#f4f6f8';
        if (pos.recommendation === 'Hold') { recColor = '#00b386'; recBg = '#e8f9f4'; }
        else if (pos.recommendation === 'Add More') { recColor = '#3b82f6'; recBg = '#eff6ff'; }
        else if (pos.recommendation === 'Exit All') { recColor = '#eb5b3c'; recBg = '#fef2f0'; }
        else if (pos.recommendation === 'Book Partial') { recColor = '#f59e0b'; recBg = '#fffbeb'; }

        let minigraph = '';
        if (pos.projectedPrices && pos.projectedPrices.length > 0) {
            const minP = Math.min(...pos.projectedPrices, mktPrice);
            const maxP = Math.max(...pos.projectedPrices, mktPrice);
            const range = maxP - minP || 1;
            const h = 44;
            let pathD = `M 0 ${h - ((mktPrice - minP)/range)*h}`;
            let areaD = `M 0 ${h} L 0 ${h - ((mktPrice - minP)/range)*h}`;
            pos.projectedPrices.forEach((p: number, idx: number) => {
                const x = ((idx + 1) / pos.projectedPrices.length) * 100;
                const y = h - ((p - minP)/range)*h;
                pathD += ` L ${x} ${y}`;
                areaD += ` L ${x} ${y}`;
            });
            areaD += ` L 100 ${h} Z`;

            const gc = pos.trend === 'Bullish' ? '#00b386' : pos.trend === 'Bearish' ? '#eb5b3c' : '#f59e0b';
            const gid = 'g' + pos.company.replace(/[^a-zA-Z0-9]/g, '');

            minigraph = `
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid #f4f6f8;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <span style="font-size:10px; color:#9aa0a6; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Expected Trajectory</span>
                        <span style="font-size:10px; font-weight:700; color:${gc};">${pos.trend}</span>
                    </div>
                    <svg viewBox="0 0 100 ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="overflow:visible; display:block;">
                        <defs>
                            <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="${gc}" stop-opacity="0.15"/>
                                <stop offset="100%" stop-color="${gc}" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                        <path d="${areaD}" fill="url(#${gid})"/>
                        <path d="${pathD}" fill="none" stroke="${gc}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="0" cy="${h - ((mktPrice - minP)/range)*h}" r="3" fill="#fff" stroke="${gc}" stroke-width="2"/>
                    </svg>
                </div>
            `;
        }

        html += `
            <div class="ta-pos-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-weight:700; color:#44475b; font-size:14px;">${pos.company}</div>
                    <div style="background:${recBg}; color:${recColor}; padding:3px 8px; border-radius:5px; font-size:10px; font-weight:700;">${pos.recommendation}</div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div style="background:#f9fafb; border-radius:7px; padding:8px 10px;">
                        <div style="font-size:10px; color:#9aa0a6; font-weight:600; text-transform:uppercase; letter-spacing:0.3px; margin-bottom:3px;">Target</div>
                        <div style="font-size:14px; font-weight:700; color:#00b386;">₹${pos.target}</div>
                    </div>
                    <div style="background:#f9fafb; border-radius:7px; padding:8px 10px;">
                        <div style="font-size:10px; color:#9aa0a6; font-weight:600; text-transform:uppercase; letter-spacing:0.3px; margin-bottom:3px;">Stop Loss</div>
                        <div style="font-size:14px; font-weight:700; color:#eb5b3c;">₹${pos.stopLoss}</div>
                    </div>
                </div>
                ${minigraph}
            </div>
        `;
    }

    content.innerHTML = html;
}


const observer = new MutationObserver(() => {
    scanPageForInjection();
});

observer.observe(document.body, { childList: true, subtree: true });
scanPageForInjection();
