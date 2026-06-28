export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  maxStock?: number | null;
  isOnOrder: boolean;
  onOrderSince?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
