-- Allow guest contact-form tickets: the /contact page is public, so a ticket
-- may have no account/company behind it yet. Logged-in founders still get
-- company_id set (used by the small ticking view on /contact).
ALTER TABLE tickets ALTER COLUMN company_id DROP NOT NULL;
