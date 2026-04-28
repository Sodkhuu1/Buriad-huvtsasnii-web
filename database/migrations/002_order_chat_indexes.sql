CREATE UNIQUE INDEX IF NOT EXISTS idx_consultation_threads_order_unique
  ON consultation_threads(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_messages_thread_sent
  ON consultation_messages(thread_id, sent_at);
