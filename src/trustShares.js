/** Taiwan-listed trust positions are valued by shares, not lots.
 * Legacy NEXPEN records saved trustLots / units as 1,000-share lots.
 * Prefer the new explicit share fields; fall back only for older records.
 */
const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export const initialTrustShares = account => account?.trustShares != null
  ? finite(account.trustShares) : finite(account?.trustLots) * 1000;
export const contributionTrustShares = flow => flow?.shares != null
  ? finite(flow.shares) : finite(flow?.units) * 1000;
export const totalTrustShares = (account, flows=[]) => initialTrustShares(account)
  + flows.reduce((sum, flow) => sum + (flow.kind==='redemption'?-1:1)*contributionTrustShares(flow), 0);
export const trustMarketValue = (account, flows, quote) => totalTrustShares(account, flows) * finite(quote);
