import { pool } from './database';

export interface Business {
  id?: number;
  name: string;
  address: string;
  taxId: string;
  annualRevenue: number;
  paymentHistory: {
    latePayments: number;
  };
  creditScore: number;
  debtToEquityRatio: number;
  cashReserves: number;
  industryCategory: string;
}

// Rule 1: Payment History Rule
function applyPaymentHistoryRule(business: Business): number {
  const latePaymentPenaltyBase = -40;
  return business.paymentHistory.latePayments * latePaymentPenaltyBase;
}

// Rule 2: Revenue Rule
function applyRevenueRule(business: Business): number {
  if (business.annualRevenue >= 1000000) {
    return 500 * business.annualRevenue/1000000;
  }
  return 0;
}

// Rule 3: Credit Score Rule
function applyCreditScoreRule(business: Business): number {
  if (business.creditScore >= 700) {
    return 300 * 1 + ((business.creditScore - 700)/100);
  }
  return 0;
}

// Rule 4: Debt-to-Equity Ratio Rule
function applyDebtToEquityRatioRule(business: Business): number {
  if (business.debtToEquityRatio > 0.5) {
    return -400 * business.debtToEquityRatio;
  }
  return 0;
}

// Rule 5: Cash Reserves Rule
function applyCashReservesRule(business: Business): number {
  if (business.cashReserves >= 100000) {
    return 200 * business.cashReserves/100000;
  }
  return 0;
}

// Rule 6: Industry Risk Rule
async function applyIndustryRiskRule(business: Business): Promise<number> {
  try {
    const result = await pool.query(
      'SELECT risk_value FROM industry_risks WHERE industry_name = $1',
      [business.industryCategory]
    );

    const riskValue = result.rows[0]?.risk_value;

    if (riskValue !== undefined) {
      return -300 * riskValue;
    } else {
      // Handle case where industry is not found in industry_risks table
      console.warn(`Risk value not found for industry: ${business.industryCategory}`);
      return 0;
    }
  } catch (err) {
    console.error('Error retrieving industry risk:', err);
    return 0;
  }
}


export async function calculateCreditLimit(business: Business): Promise<number> {
  let creditLimit = 1000; // Base credit limit
  
  // Apply rules
  creditLimit += applyPaymentHistoryRule(business);
  creditLimit += applyRevenueRule(business);
  creditLimit += applyCreditScoreRule(business);
  creditLimit += applyDebtToEquityRatioRule(business);
  creditLimit += applyCashReservesRule(business);
  creditLimit += await applyIndustryRiskRule(business); // Note the await here

  return creditLimit/100 * business.annualRevenue;
}