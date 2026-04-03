-- 1. Bảng Permissions
CREATE TABLE permissions
(
    name        VARCHAR(255) PRIMARY KEY,
    description VARCHAR(255)
);

-- 2. Bảng Roles
CREATE TABLE roles
(
    name        VARCHAR(255) PRIMARY KEY,
    description VARCHAR(255)
);

-- 3. Bảng trung gian Role - Permission
CREATE TABLE role_permissions
(
    role_name       VARCHAR(255) NOT NULL,
    permission_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (role_name, permission_name),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_name) REFERENCES roles (name),
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_name) REFERENCES permissions (name)
);

-- 4. Bảng Users
CREATE TABLE users
(
    id             VARCHAR(36) PRIMARY KEY,
    username       VARCHAR(255) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    full_name      VARCHAR(255),
    dob            DATE,
    phone_number   VARCHAR(50),
    city           VARCHAR(255),
    avatar         VARCHAR(255),
    base_currency  VARCHAR(50)           DEFAULT 'VND',
    deleted        BOOLEAN      NOT NULL DEFAULT FALSE,
    current_jwt_id VARCHAR(255),
    provider       VARCHAR(50)           DEFAULT 'LOCAL',
    provider_id    VARCHAR(255)
);

-- 5. Bảng trung gian User - Role
CREATE TABLE user_roles
(
    user_id   VARCHAR(36)  NOT NULL,
    role_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, role_name),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_ur_role FOREIGN KEY (role_name) REFERENCES roles (name)
);