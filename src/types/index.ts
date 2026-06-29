// 使用者輸入的原始需求
export interface QuoteRequest {
  raw_requirement: string; // 例如: "500個鋁合金L型支架，下週三交"
}

// AI 回傳的標準化報價結果
export interface QuoteResponse {
  raw_requirement?: string; // 原始輸入需求 (前端塞入，方便後續寫回資料庫)
  suggested_price: number;
  confidence_score: number; // 0.0 ~ 1.0
  cost_breakdown: {
    material: number;
    machining: number;
    outsourcing: number;
  };
  risk_warnings: string[];
  similar_cases: Array<{
    id: string;
    similarity: number;
    unit_price: number;
  }>;
}