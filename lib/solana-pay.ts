import BigNumber from "bignumber.js";
import { encodeURL, findReference, validateTransfer } from "@solana/pay";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { env, optionalEnv } from "@/lib/env";

export const SOLANA_DEMO_PRICE_SOL = "0.01";

export function solanaConnection(): Connection {
  return new Connection(optionalEnv("SOLANA_RPC_URL") ?? clusterApiUrl("devnet"), "confirmed");
}

export function merchantWalletPublicKey(): PublicKey {
  return new PublicKey(env("MERCHANT_WALLET_PUBLIC_KEY"));
}

export function bookingPriceInSol(price: number | null | undefined): BigNumber {
  if (!price || price <= 0) {
    return new BigNumber(SOLANA_DEMO_PRICE_SOL);
  }

  return new BigNumber(price);
}

export function createSolanaPaymentUrl(input: {
  amount: BigNumber;
  reference: PublicKey;
  message: string;
}): URL {
  return encodeURL({
    recipient: merchantWalletPublicKey(),
    amount: input.amount,
    reference: input.reference,
    label: "Tend",
    message: input.message
  });
}

export function generatePaymentReference(): PublicKey {
  return Keypair.generate().publicKey;
}

export async function findAndValidateSolanaPayment(input: {
  amount: BigNumber;
  reference: PublicKey;
}): Promise<string> {
  const connection = solanaConnection();
  const signatureInfo = await findReference(connection, input.reference, { finality: "confirmed" });
  await validateTransfer(
    connection,
    signatureInfo.signature,
    {
      recipient: merchantWalletPublicKey(),
      amount: input.amount,
      reference: input.reference
    },
    { commitment: "confirmed" }
  );
  return signatureInfo.signature;
}
