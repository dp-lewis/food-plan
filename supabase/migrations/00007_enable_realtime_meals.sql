-- Required for DELETE payloads to include the full old row (id, user_id, etc.)
ALTER TABLE meals REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE meals;
