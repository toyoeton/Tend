import BigNumber from "bignumber.js";
import { SOLANA_DEMO_PRICE_SOL } from "@/lib/solana-pay";

type SolPriceResponse = { solana?: { ngn?: number } };

export async function getSolNgnRate(): Promise<number | null> {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=ngn", {
      next: { revalidate: 60 }
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as SolPriceResponse;
    const rate = payload.solana?.ngn;
    return rate && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

export async function resolveSolPrice(nairaKobo: number, override?: number | null): Promise<BigNumber> {
  if (override && override > 0) return new BigNumber(override);
  const rate = await getSolNgnRate();
  if (!rate) return new BigNumber(SOLANA_DEMO_PRICE_SOL);
  return new BigNumber(nairaKobo).dividedBy(100).dividedBy(rate);
}

export function displaySolPrice(nairaKobo: number, override: number | null | undefined, rate: number | null): string | null {
  const sol = override && override > 0 ? override : rate ? nairaKobo / 100 / rate : null;
  return sol ? `${sol.toFixed(4)} SOL` : null;
}
