-- 啟用 quotes_history 資料表的 RLS (Row Level Security) 防護
ALTER TABLE quotes_history ENABLE ROW LEVEL SECURITY;

-- 移除原先賦予 anon 的所有權限（讓外部無法透過 REST API 進行任何 CRUD）
REVOKE ALL ON quotes_history FROM anon;

-- 我們【不需要】建立任何 POLICY 給 anon 或 authenticated，
-- 因為預設情況下 (Default Deny)，啟用 RLS 就會封鎖所有的請求。
-- 而我們的 Edge Function 會使用 SERVICE_ROLE_KEY，
-- 該金鑰擁有 BYPASSRLS 的特權，因此不受此限制，能正常運作。
