ALTER TABLE checked_items ADD COLUMN checked_by_email TEXT;

ALTER TABLE checked_items REPLICA IDENTITY FULL;
ALTER TABLE custom_shopping_items REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE checked_items;
ALTER PUBLICATION supabase_realtime ADD TABLE custom_shopping_items;
