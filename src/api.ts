import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { Business, calculateCreditLimit } from './business';
import { pool } from './database';

const app = express();
const port = 3000;

app.use(bodyParser.json());

// POST /api/businesses
app.post('/api/businesses', async (req: Request, res: Response) => {
  const business: Business = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO businesses(name, address, tax_id, annual_revenue, late_payments, credit_score, debt_to_equity_ratio, cash_reserves, industry_category) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [business.name, business.address, business.taxId, business.annualRevenue, business.paymentHistory.latePayments, business.creditScore, business.debtToEquityRatio, business.cashReserves, business.industryCategory]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/businesses/{id}
app.get('/api/businesses/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [
      req.params.id,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Business not found');
    }
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// POST /api/businesses/{id}/credit-limit
app.post('/api/businesses/:id/credit-limit', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [
      req.params.id,
    ]);
    if (result.rows.length > 0) {
      const business: Business = result.rows[0];
      const creditLimit = calculateCreditLimit(business);
      res.json({ creditLimit });
    } else {
      res.status(404).send('Business not found');
    }
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
