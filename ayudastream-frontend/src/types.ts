export type Page = "landing" | "home" | "escrow" | "history";

export interface Escrow {
  id: string;
  supplier: string;
  amount: number;
  fee: number;
  releaseWindow: 24 | 72 | 168;
  status: "ACTIVE" | "RELEASED" | "PENDING" | "DISPUTED";
  txHash: string;
  createdAt: number;
  releaseAt: number;
  crop: string;
  note: string;
}