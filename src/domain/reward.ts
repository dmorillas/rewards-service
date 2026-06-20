export interface RewardDefinition {
  id: string;
  name: string;
  content: RewardDefinitionContent[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export type RewardDefinitionContent = FixedReward | RandomReward;

export interface FixedReward {
  type: "fixed";
  rewards: FixedRewardEntry[];
}

export interface FixedRewardEntry {
  resource: RewardType;
  amount: number;
}

export interface RandomReward {
  type: "random";
  rewards: RandomRewardEntry[];
}

export interface RandomRewardEntry {
  resource: RewardType;
  chance: number;
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
}

export enum RewardType {
  Energy = "energy",
  Currency = "currency",
  Xp = "xp",
}

export class RewardAmount {
  energy: number;
  currency: number;
  xp: number;

  constructor(energy = 0, currency = 0, xp = 0) {
    this.energy = energy;
    this.currency = currency;
    this.xp = xp;
  }
}

export class Reward {
  type: RewardType;
  amount: number;

  constructor(type: RewardType, amount: number) {
    this.type = type;
    this.amount = amount;
  }
}
