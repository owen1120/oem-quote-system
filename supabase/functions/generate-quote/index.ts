import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 處理瀏覽器 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { raw_requirement } = await req.json()

    // 取得環境變數
    let geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      try {
        const localEnv = await import('../_shared/env.ts')
        geminiApiKey = localEnv.LOCAL_GEMINI_API_KEY
      } catch (e) {
        // ignore in production
      }
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY")
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase credentials")

    // TODO 1: 呼叫 Gemini embedding 將 raw_requirement 轉成向量
    const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-2',
        content: { parts: [{ text: raw_requirement }] },
        outputDimensionality: 768
      })
    });
    
    if (!embedRes.ok) {
      throw new Error(`Embedding API failed: ${await embedRes.text()}`);
    }
    
    const embedData = await embedRes.json();
    const embedding = embedData.embedding.values;

    // TODO 2: 呼叫 Supabase RPC (match_quotes) 尋找相似歷史報價
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: similarCases, error: rpcError } = await supabaseClient.rpc('match_quotes', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3
    });

    if (rpcError) {
      throw new Error(`RPC match_quotes failed: ${rpcError.message}`);
    }

    // TODO 3: 組合 RAG Prompt，呼叫 Gemini 產生 JSON 報價結果
    const promptText = `
你是一個專業的 CNC 與鈑金自動化報價系統 AI。
使用者輸入的加工需求: "${raw_requirement}"

以下是資料庫中找到的相似歷史報價資料 (作為參考):
${JSON.stringify(similarCases || [])}

請根據使用者需求和相似的歷史報價，計算並回傳最新的建議報價。
請務必嚴格以 JSON 格式回傳，並且必須符合以下的資料結構：
{
  "suggested_price": 數字 (建議單價),
  "confidence_score": 數字 (信心分數，範圍 0.0 到 1.0),
  "cost_breakdown": {
    "material": 數字 (材料成本),
    "machining": 數字 (加工成本),
    "outsourcing": 數字 (外包成本)
  },
  "risk_warnings": 字串陣列 (風險警告清單，如交期太短、公差過嚴等，若無則為空陣列),
  "similar_cases": [
    { "id": "uuid", "similarity": 數字, "unit_price": 數字 }
  ]
}
    `;

    const generateRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!generateRes.ok) {
      throw new Error(`Gemini API failed: ${await generateRes.text()}`);
    }

    const generateData = await generateRes.json();
    const finalQuoteJSON = generateData.candidates[0].content.parts[0].text;
    
    // 將 Gemini 回傳的 JSON 轉為物件
    const finalQuote = JSON.parse(finalQuoteJSON);

    // 回傳給前端
    return new Response(
      JSON.stringify(finalQuote),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})