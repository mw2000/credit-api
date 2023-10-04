import { pool } from './database';
import { NotFoundError, CalculationError } from './errors';

export interface Business {
  id: number;
  name: string;
  address: string;
  tax_id: string;
  annual_revenue: number;
  late_payments: number;
  credit_score: number;
  debt_to_equity_ratio: number;
  cash_reserves: number;
  industry_category: string;
}

// Rule 1: Payment History Rule
function applyPaymentHistoryRule(business: Business): number {
  const late_payment_penalty_base = -40;
  return business.late_payments * late_payment_penalty_base;
}

// Rule 2: Revenue Rule
function applyRevenueRule(business: Business): number {
  if (business.annual_revenue >= 1000000) {
    return 500 * business.annual_revenue/1000000;
  }
  return 0;
}

// Rule 3: Credit Score Rule
function applyCreditScoreRule(business: Business): number {
  if (business.credit_score >= 700) {
    return 300 * 1 + ((business.credit_score - 700)/100);
  }
  return 0;
}

// Rule 4: Debt-to-Equity Ratio Rule
function applyDebtToEquityRatioRule(business: Business): number {
  if (business.debt_to_equity_ratio > 0.5) {
    return -400 * business.debt_to_equity_ratio;
  }
  return 0;
}

// Rule 5: Cash Reserves Rule
function applyCashReservesRule(business: Business): number {
  if (business.cash_reserves >= 100000) {
    return 200 * business.cash_reserves/100000;
  }
  return 0;
}

// Rule 6: Industry Risk Rule
async function applyIndustryRiskRule(business: Business): Promise<number> {
  try {
    const result = await pool.query(
      'SELECT risk_value FROM industry_risks WHERE industry_name = $1',
      [business.industry_category]
    );

    const riskValue = result.rows[0]?.risk_value;

    if (riskValue !== undefined) {
      return -300 * riskValue;
    } else {
      // Handle case where industry is not found in industry_risks table
      console.warn(`Risk value not found for industry: ${business.industry_category}`);
      return 0;
    }
  } catch (err) {
    console.error(`Error retrieving industry risk: ${err}`);
    throw new NotFoundError(`Error retrieving industry risk: ${err}`);
  }
}


export async function calculateCreditLimit(business: Business): Promise<number> {
  let credit_limit = 1000; // Base credit limit
  
  try {
    // Apply rules
    credit_limit += applyPaymentHistoryRule(business);
    credit_limit += applyRevenueRule(business);
    credit_limit += applyCreditScoreRule(business);
    credit_limit += applyDebtToEquityRatioRule(business);
    credit_limit += applyCashReservesRule(business);
    credit_limit += await applyIndustryRiskRule(business);

    return credit_limit/100 * business.annual_revenue;
  } catch (err) {
    console.error(`Error calculating creditLimit: ${err}`);
    throw new CalculationError(`Error calculating creditLimit: ${err}`);
  }
}