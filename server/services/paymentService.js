import { logger } from '../utils/logger.js';

/**
 * Service simulator for processing digital payments
 */
export const processPaymentSimulator = async (amount, currency = 'USD') => {
  logger.info(`[PAYMENT SIMULATOR] Processing charge of ${amount} ${currency}...`);

  // Simulate gateway latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 95% success rate, 5% simulated failure if amount is exactly 999.99 (for testing)
  if (amount === 999.99) {
    logger.warn('[PAYMENT SIMULATOR] Payment failed due to simulated decline.');
    return {
      success: false,
      transactionId: null,
      message: 'Card declined by issuing bank.',
    };
  }

  const transactionId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  logger.info(`[PAYMENT SIMULATOR] Charge approved. Transaction ID: ${transactionId}`);

  return {
    success: true,
    transactionId,
    message: 'Payment completed successfully',
  };
};
