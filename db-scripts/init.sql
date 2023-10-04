DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_tables 
        WHERE schemaname != 'pg_catalog' 
        AND schemaname != 'information_schema'
        AND tablename = 'businesses'
    ) THEN
        -- Create business table
        CREATE TABLE businesses (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(255) NOT NULL,
            tax_id VARCHAR(50) NOT NULL,
            annual_revenue NUMERIC NOT NULL,
            late_payments INTEGER NOT NULL,
            credit_score INTEGER NOT NULL,
            debt_to_equity_ratio NUMERIC NOT NULL,
            cash_reserves NUMERIC NOT NULL,
            industry_category VARCHAR(255) NOT NULL
        );
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_tables 
        WHERE schemaname != 'pg_catalog' 
        AND schemaname != 'information_schema'
        AND tablename = 'industry_risks'
    ) THEN
        -- Create industry risks table
        CREATE TABLE industry_risks (
            id SERIAL PRIMARY KEY,
            industry_name VARCHAR(255),
            risk_value NUMERIC CHECK (risk_value >= 0 AND risk_value <= 1)
        );

        -- Insert industry risk values
        INSERT INTO industry_risks (industry_name, risk_value) VALUES 
        ('Manufacturing', 0.2),
        ('Retail', 0.3),
        ('Technology', 0.1),
        ('Construction', 0.4),
        ('Finance', 0.1);
    END IF;
END $$;
