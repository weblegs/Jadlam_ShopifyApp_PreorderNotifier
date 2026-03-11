-- Remove the failed SQLite migration record so prisma migrate deploy can proceed
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20240530213853_create_session_table'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;
