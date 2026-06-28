export type StaffRole = 'ESTATE_MANAGER' | 'READ_ONLY';

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EstateSettings {
  id: string;
  villaBaseRate: number;
  taxRate: number;
  serviceChargeRate: number;
  notifyNewInquiry: boolean;
  notifyNewRequest: boolean;
  notifyTaskOverdue: boolean;
  notifyInventoryLow: boolean;
  notifyLodgifyError: boolean;
  notifyStripeError: boolean;
  updatedAt: string;
}

export interface IntegrationStatus {
  key: string;
  name: string;
  connected: boolean;
  lastSyncAt: string | null;
}
