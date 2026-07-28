export type Page = "landing" | "dashboard" | "deploy" | "audit";

export interface Disbursement {
  id: string; 
  farmer: string; 
  amount: number; 
  status: "ALLOCATED";
  txHash: string; 
  createdAt: number; 
  program: string; 
  municipality: string;
}