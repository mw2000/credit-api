import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { Business, calculateCreditLimit } from './business';
import { pool } from './database';
import { ValidationError, NotFoundError, CalculationError } from './errors';

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Validation function
const validateBusiness = (business: Business) => {
  const properties: (keyof Business)[] = ['name', 'address', 'tax_id', 'annual_revenue', 'late_payments', 'credit_score', 'debt_to_equity_ratio', 'cash_reserves', 'industry_category'];
  for (const prop of properties) {
    if (!business[prop]) {
      throw new ValidationError(`Property ${prop} cannot be empty`);
    }
  }
};

// POST /api/businesses
app.post('/api/businesses', async (req: Request, res: Response) => {
  try {
    const business: Business = req.body;
    validateBusiness(business);

    const result = await pool.query(
      'INSERT INTO businesses(name, address, tax_id, annual_revenue, late_payments, credit_score, debt_to_equity_ratio, cash_reserves, industry_category) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [business.name, business.address, business.tax_id, business.annual_revenue, business.late_payments, business.credit_score, business.debt_to_equity_ratio, business.cash_reserves, business.industry_category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Server error occurred:', err);

    if (err instanceof ValidationError) {
      res.status(400).send(`Validation Error: ${err.message}`);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

// GET /api/businesses/{id}
app.get('/api/businesses/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      throw new NotFoundError('Business not found');
    }
  } catch (err) {
    console.error('Server error occurred:', err);

    if (err instanceof NotFoundError) {
      res.status(404).send(`NotFoundError: ${err.message}`);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

// POST /api/businesses/{id}/credit-limit
app.post('/api/businesses/:id/credit-limit', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      const business: Business = result.rows[0];
      const credit_limit = await calculateCreditLimit(business);
      res.json({ credit_limit });
    } else {
      throw new NotFoundError('Business not found');
    }
  } catch (err) {
    console.error('Server error occurred:', err);

    if (err instanceof NotFoundError) {
      res.status(404).send(`NotFoundError: ${err.message}`);
    } else if (err instanceof CalculationError) {
      res.status(500).send(`CalculationError: ${err.message}`)
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});



