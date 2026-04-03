CREATE TABLE wallets
(
    id            VARCHAR(36) PRIMARY KEY,
    name          VARCHAR(255)   NOT NULL,
    balance       NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
    currency      VARCHAR(50)             DEFAULT 'VND',
    type          VARCHAR(50)    NOT NULL DEFAULT 'BASIC',
    target_amount NUMERIC(19, 2),
    deadline      DATE,
    user_id       VARCHAR(255)   NOT NULL,
    is_active     BOOLEAN                 DEFAULT TRUE,
    created_at    TIMESTAMP,
    version       BIGINT
);