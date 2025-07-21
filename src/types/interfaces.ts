export interface PalletSummary {
  lpn: string;
  type: string;
  status: string;
  location: string | undefined;
  isMixed: boolean;
  weight: {
    current: number;
    max: number;
    available: number;
    utilization: number;
  };
  volume: {
    current: number;
    max: number;
    available: number;
  };
  items: {
    current: number;
    max: number;
    available: number;
  };
  contents: Array<{
    sku: string;
    quantity: number;
    condition: string;
    lotNumber?: string;
    expiryDate?: Date;
  }>;
  totalSkus: number;
}

export interface PalletsNeeded {
  palletCount: number;
  quantityPerPallet: number;
  remainingQuantity: number;
}

export interface ReceiveLineResult {
  line: import('../entities/ReceiptLine.entity').ReceiptLineEntity;
  pallets: import('../entities/Container.entity').ContainerEntity[];
}

export interface TransactionFilters {
  sku?: string;
  locationCode?: string;
  type?: string;
  limit?: number;
}