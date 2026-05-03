-- Payment Hub Database Schema
-- Version: 1.0
-- Last Updated: 2026-04-27

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) UNIQUE NOT NULL,
    tenant_name VARCHAR(200) NOT NULL,
    webhook_url VARCHAR(500) NOT NULL,
    webhook_secret VARCHAR(100),
    rate_limit_per_minute INT DEFAULT 100,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_tenant_id ON tenants(tenant_id);

-- Payment methods table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id),
    method_id VARCHAR(50) NOT NULL,
    method_name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    enabled BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, method_id)
);

CREATE INDEX idx_payment_methods_tenant ON payment_methods(tenant_id);

-- Provider configurations table
CREATE TABLE provider_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id),
    provider_id VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    merchant_id VARCHAR(100) NOT NULL,
    api_key_ref VARCHAR(200) NOT NULL, -- KMS reference, not plaintext
    secret_key_ref VARCHAR(200) NOT NULL, -- KMS reference, not plaintext
    callback_url VARCHAR(500) NOT NULL,
    return_url VARCHAR(500) NOT NULL,
    webhook_ip_whitelist TEXT[], -- Array of IPs
    extra_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, provider_id)
);

CREATE INDEX idx_provider_configs_tenant ON provider_configs(tenant_id);

-- Transactions table (Event Sourcing)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    payment_request_code VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id),
    order_code VARCHAR(100) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    state VARCHAR(50) NOT NULL,
    customer_info JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_transactions_code ON transactions(transaction_code);
CREATE INDEX idx_transactions_payment_request ON transactions(payment_request_code);
CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_state ON transactions(state);

-- Transaction events table (Event Sourcing)
CREATE TABLE transaction_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sequence_number INT NOT NULL,
    UNIQUE(transaction_id, sequence_number)
);

CREATE INDEX idx_transaction_events_transaction ON transaction_events(transaction_id);
CREATE INDEX idx_transaction_events_created ON transaction_events(created_at);

-- Payment splits table
CREATE TABLE payment_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    split_code VARCHAR(50) UNIQUE NOT NULL,
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    method_id VARCHAR(50) NOT NULL,
    provider_id VARCHAR(50),
    amount DECIMAL(18, 2) NOT NULL,
    state VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(200),
    provider_order_id VARCHAR(200),
    redirect_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT chk_split_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payment_splits_transaction ON payment_splits(transaction_id);
CREATE INDEX idx_payment_splits_code ON payment_splits(split_code);
CREATE INDEX idx_payment_splits_provider_txn ON payment_splits(provider_transaction_id);

-- Webhooks table (Idempotency)
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    provider_id VARCHAR(50) NOT NULL,
    raw_payload TEXT NOT NULL,
    parsed_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_idempotency ON webhooks(idempotency_key);
CREATE INDEX idx_webhooks_provider ON webhooks(provider_id);
CREATE INDEX idx_webhooks_processed ON webhooks(processed);

-- Outbox table (Transactional Outbox Pattern)
CREATE TABLE outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retry_count INT DEFAULT 0,
    last_error TEXT
);

CREATE INDEX idx_outbox_published ON outbox(published);
CREATE INDEX idx_outbox_created ON outbox(created_at);

-- Inbox table (Idempotent Consumer Pattern)
CREATE TABLE inbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    message_type VARCHAR(100) NOT NULL,
    message_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_inbox_idempotency ON inbox(idempotency_key);
CREATE INDEX idx_inbox_processed ON inbox(processed);
CREATE INDEX idx_inbox_expires ON inbox(expires_at);

-- Tenant notifications table (Callback tracking)
CREATE TABLE tenant_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id),
    webhook_url VARCHAR(500) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL, -- PENDING, SENT, FAILED
    retry_count INT DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_retry_at TIMESTAMP
);

CREATE INDEX idx_tenant_notifications_transaction ON tenant_notifications(transaction_id);
CREATE INDEX idx_tenant_notifications_status ON tenant_notifications(status);
CREATE INDEX idx_tenant_notifications_next_retry ON tenant_notifications(next_retry_at);

-- Insert demo data
INSERT INTO tenants (tenant_id, tenant_name, webhook_url, enabled) VALUES
('tenant-a', 'Tenant A', 'http://localhost:5001/webhook', TRUE);

INSERT INTO payment_methods (tenant_id, method_id, method_name, enabled, display_order) VALUES
('tenant-a', 'CASH', 'Tiền mặt', TRUE, 1),
('tenant-a', 'ZALOPAY', 'ZaloPay', TRUE, 2),
('tenant-a', 'MOMO', 'MoMo', TRUE, 3);

INSERT INTO provider_configs (tenant_id, provider_id, enabled, merchant_id, api_key_ref, secret_key_ref, callback_url, return_url) VALUES
('tenant-a', 'ZALOPAY', TRUE, 'merchant_zalopay_001', 'kms://zalopay/api_key', 'kms://zalopay/secret', 'http://localhost:5000/api/webhooks/zalopay', 'http://localhost:3000/payment/result'),
('tenant-a', 'MOMO', TRUE, 'merchant_momo_001', 'kms://momo/api_key', 'kms://momo/secret', 'http://localhost:5000/api/webhooks/momo', 'http://localhost:3000/payment/result');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_configs_updated_at BEFORE UPDATE ON provider_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup expired inbox entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_inbox()
RETURNS void AS $$
BEGIN
    DELETE FROM inbox WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE payment_hub IS 'Payment Hub MVP Database';
COMMENT ON TABLE transactions IS 'Transaction aggregate root (Event Sourcing)';
COMMENT ON TABLE transaction_events IS 'Transaction event store';
COMMENT ON TABLE webhooks IS 'Webhook idempotency store';
COMMENT ON TABLE outbox IS 'Transactional outbox for reliable event publishing';
COMMENT ON TABLE inbox IS 'Idempotent consumer inbox';
