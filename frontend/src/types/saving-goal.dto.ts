import { ApiResponse } from "./api";

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  percentage: number;
}

export interface SavingGoalRequest {
  name: string;
  targetAmount: number;
  currency?: string;
  deadline: string;
}

export interface FundAddRequest {
  amount: number;
}
