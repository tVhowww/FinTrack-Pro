CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date_active
    ON transactions (wallet_id, date DESC)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_type_date_active
    ON transactions (wallet_id, type, date DESC)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_transactions_category_date_active
    ON transactions (category_id, date DESC)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_transactions_saga_id
    ON transactions (saga_id)
    WHERE saga_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_created_at_active
    ON transactions (created_at DESC)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_categories_user_type_active
    ON categories (user_id, type)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_categories_parent_active
    ON categories (parent_id)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year
    ON budgets (user_id, year, month);

CREATE INDEX IF NOT EXISTS idx_budgets_wallet_month_year
    ON budgets (wallet_id, year, month);

CREATE INDEX IF NOT EXISTS idx_budgets_category_month_year
    ON budgets (category_id, year, month);

CREATE UNIQUE INDEX IF NOT EXISTS uq_exchange_rates_base_target
    ON exchange_rates (base_currency, target_currency);
