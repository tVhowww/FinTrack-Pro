-- V4: Thêm cột retry_count và next_retry_at vào outbox_events
-- Cho phép scheduler thực hiện exponential backoff retry đúng cách.
ALTER TABLE outbox_events
    ADD COLUMN IF NOT EXISTS retry_count   INTEGER   NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP;

-- Reset các event đang bị kẹt ở FAILED về PENDING để relay xử lý lại
UPDATE outbox_events
SET status = 'PENDING',
    retry_count = 0,
    next_retry_at = NULL,
    error_message = NULL
WHERE status = 'FAILED';
