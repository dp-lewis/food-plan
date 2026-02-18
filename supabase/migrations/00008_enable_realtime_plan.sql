-- Enable full replica identity so DELETE events include the old row data
ALTER TABLE meal_plans REPLICA IDENTITY FULL;

-- Add meal_plans to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans;
