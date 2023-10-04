# credit-api


## Introduction
A RESTful API service that calculates a credit limit for a business based on a set of predefined rule evaluations. Accepts business data as input and returns the calculated credit limit as output.

## How to run
Fully dockerized service, ready to go.
```
docker compose up --build
```

You can then test the endpoints in Postman

## Architechture
This uses typescript with express + postgres database as a backend

### Endpoints
- **`POST /api/businesses`**: Create a new business profile with relevant information. Returns a JSON Object -> Business
- **`GET /api/businesses/{id}`**: Retrieve a business profile by ID. Returns a JSON object -> Business
- **`POST /api/businesses/{id}/credit-limit`**: Calculate and return the credit limit for a specific business. Returns a JSON Object -> { credit_limit: xxx }

### Custom Errors:
- **`NotFoundError`**: Any issue with retrieveing from Postgres
- **`CalculationError`**: Error calculating the credit limit
- **`ValidationError`**: Invalid business object (fields missing)

### Data Model
```
TABLE businesses (
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

TABLE industry_risks (
    id SERIAL PRIMARY KEY,
    industry_name VARCHAR(255),
    risk_value NUMERIC CHECK (risk_value >= 0 AND risk_value <= 1)
);

```

### Rules for Credit Evaluation
All businesses start out with a base credit of 1000. This is then modified based on the rules and then divided by 100 and multiplied by the annual revenue of the company to give its credit limit.

- **Payment History Rule**: Each late payment reduces base credit by 40
- **Revenue Rule**: Above a revenue threshold of 1000000, an extra 500 is added to base credit and multipled by revenue/1000000.
- **Credit Score Rule**: If credit score is >= 700 then 300 is multiplied by a multiplier ( 1 + (credit_score - 700) / 100) and added to the base.
- **Debt-to-Equity-Ratio Rule**: If debt-to-equity-ratio is > 0.5 then base credit limit is negated by 400 multiplied by debt-to-equity-ratio
- **Cash Reserves rule**: If cash reserves are > 100000 then  200 * cash reserves/100000 is added to base credit.
- **Industry Risk rule**: -300 multiplied by the risk value of each industry is negated from base credit

The industries and risk values added to the database are:
- ('Manufacturing', 0.2)
- ('Retail', 0.3)
- ('Technology', 0.1)
- ('Construction', 0.4)
- ('Finance', 0.1)

