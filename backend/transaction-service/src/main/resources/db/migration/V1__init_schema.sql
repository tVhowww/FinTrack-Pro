-- 1. Bảng Categories
CREATE TABLE categories
(
    id          VARCHAR(36) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50),
    description VARCHAR(255),
    user_id     VARCHAR(36),
    is_deleted  BOOLEAN DEFAULT FALSE,
    parent_id   VARCHAR(36),
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
);

-- 2. Bảng Transactions
CREATE TABLE transactions
(
    id              VARCHAR(36) PRIMARY KEY,
    amount          NUMERIC(19, 2) NOT NULL,
    type            VARCHAR(50)    NOT NULL,
    wallet_id       VARCHAR(255)   NOT NULL,
    category_id     VARCHAR(36),
    note            VARCHAR(255),
    date            TIMESTAMP      NOT NULL,
    saga_id         VARCHAR(255),
    transfer_status VARCHAR(50),
    is_deleted      BOOLEAN                 DEFAULT FALSE NOT NULL,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,
    CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- 3. Bảng Budgets
CREATE TABLE budgets
(
    id          VARCHAR(36) PRIMARY KEY,
    name        VARCHAR(255)   NOT NULL,
    amount      NUMERIC(19, 2) NOT NULL,
    wallet_id   VARCHAR(255),
    user_id     VARCHAR(255)   NOT NULL,
    category_id VARCHAR(36)    NOT NULL,
    month       INT            NOT NULL,
    year        INT            NOT NULL,
    currency    VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP
);

-- 4. Bảng Exchange Rates
CREATE TABLE exchange_rates
(
    id              VARCHAR(36) PRIMARY KEY,
    base_currency   VARCHAR(50)    NOT NULL,
    target_currency VARCHAR(50)    NOT NULL,
    rate            NUMERIC(19, 6) NOT NULL,
    last_updated    TIMESTAMP      NOT NULL
);