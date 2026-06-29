-- 開啟 pgvector 擴充
CREATE EXTENSION IF NOT EXISTS vector;

-- 建立歷史報價庫
CREATE TABLE quotes_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    raw_requirement TEXT NOT NULL,
    embedding vector(768), -- Gemini text-embedding-004 的維度
    material TEXT,
    dimensions JSONB,      -- 存放 {"L": 100, "W": 50, "H": 10}
    unit_price NUMERIC NOT NULL,
    machining_tags TEXT[]  -- 存放 ['deep_thread', 'wire_cutting']
);

-- 建立向量搜尋用的 HNSW 索引 (提升搜尋速度)
CREATE INDEX ON quotes_history USING hnsw (embedding vector_cosine_ops);

-- 建立 RPC 函數供 Edge Function 呼叫，進行餘弦相似度比對
CREATE OR REPLACE FUNCTION match_quotes(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  raw_requirement text,
  unit_price numeric,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    quotes_history.id,
    quotes_history.raw_requirement,
    quotes_history.unit_price,
    1 - (quotes_history.embedding <=> query_embedding) AS similarity
  FROM quotes_history
  WHERE 1 - (quotes_history.embedding <=> query_embedding) > match_threshold
  ORDER BY quotes_history.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 設定權限，允許 Supabase API 角色存取此資料表
GRANT ALL ON quotes_history TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_quotes TO anon, authenticated, service_role;