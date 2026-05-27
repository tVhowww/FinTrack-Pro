CREATE TABLE IF NOT EXISTS wallet_audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    wallet_id VARCHAR(255) NOT NULL,
    previous_balance DECIMAL(19, 2) NOT NULL,
    new_balance DECIMAL(19, 2) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    transaction_type VARCHAR(50),
    reference_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_wallet_id ON wallet_audit_logs(wallet_id);
