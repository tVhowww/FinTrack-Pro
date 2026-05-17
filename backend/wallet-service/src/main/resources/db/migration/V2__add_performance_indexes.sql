CREATE INDEX IF NOT EXISTS idx_wallets_user_active_created
    ON wallets (user_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallets_user_currency_active
    ON wallets (user_id, currency, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wallets_user_lower_name_active
    ON wallets (user_id, LOWER(name))
    WHERE is_active = TRUE;
