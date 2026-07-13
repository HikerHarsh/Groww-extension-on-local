interface AnalysisData {
  trend: string;
  entry: string;
  sl: string;
  target: string;
  duration: string;
  realBal: number;
  realQty: string;
  realPnl: string;
  customQty: string;
  customPnl: string;
  newsSentiment?: string;
  newsList?: { title: string, link: string, sentiment: string }[];
}

interface AnalysisResponse {
  success: boolean;
  data?: AnalysisData;
}

interface AnalysisRequest {
  type: string;
  stockName: string;
  ticker: string;
  currentPrice: number;
  durationType: string;
  balance: number;
  customBalance: number;
}

interface PositionData {
  company: string;
  ticker: string;
  qty: number;
  mktPrice: number;
  avgPrice: number;
  returns: number;
}

interface PositionsAnalysisRequest {
  type: 'ANALYZE_POSITIONS';
  positions: PositionData[];
  durationType: string;
}

interface PositionAnalysisResult {
  ticker: string;
  company: string;
  holdConfidence: number;
  recommendation: 'Hold' | 'Book Partial' | 'Exit All' | 'Add More';
  stopLoss: number;
  target: number;
  projectedPrices: number[];
  trend: 'Bullish' | 'Bearish' | 'Neutral';
}

interface PositionsAnalysisResponse {
  success: boolean;
  data?: {
    overallHealth: number;
    positions: PositionAnalysisResult[];
  };
}
