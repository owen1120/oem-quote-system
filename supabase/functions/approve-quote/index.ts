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
    const { raw_requirement, unit_price } = await req.json()

    if (!raw_requirement || typeof unit_price !== 'number') {
      throw new Error("Missing or invalid parameters: raw_requirement and unit_price are required")
    }

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

    // 1. 呼叫 Gemini embedding 將 raw_requirement 轉成向量
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

    // 2. 將新資料寫入 Supabase (quotes_history)
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: insertData, error: insertError } = await supabaseClient
      .from('quotes_history')
      .insert({
        raw_requirement: raw_requirement,
        unit_price: unit_price,
        embedding: embedding
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    // 回傳成功訊息
    return new Response(
      JSON.stringify({ success: true, data: insertData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
