CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    -- NULL for guest contact-form tickets (no account / company yet).
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'raised'
        CHECK (status IN ('raised', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_company_id ON tickets(company_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_email ON tickets(email);