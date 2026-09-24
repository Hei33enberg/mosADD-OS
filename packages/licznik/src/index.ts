/**
 * LICZNIK — brama proxy z licznikiem i księgą paragonów.
 * Wejście: wiadomości. Wyjście: odpowiedź + paragon z marżą.
 */
export type { ChainMessage, ChainRequest, ChainResult, ChainStep } from './chain.js';
export { defaultChain, runChain } from './chain.js';
export type { TokenUsage, CostBreakdown, ReceiptTotals } from './meter.js';
export { computeWholesale, applyMargin } from './meter.js';
export type { ModelPrice } from './pricing.js';
export { PRICING, DEFAULT_PRICE, DEFAULT_MARGIN_PCT, priceFor } from './pricing.js';
export type { Receipt, ReceiptsSummary, ReceiptsStore } from './receipts.js';
export { makeReceipt, summarize, JsonFileReceiptsStore, MemoryReceiptsStore } from './receipts.js';
