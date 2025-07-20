export interface CreateMovementDetailDto {
  productId: number;
  quantity: number;
  purchasePrice: number;
  salePrice?: number;
}

export interface CreateMovementDto {
  movementTypeId: number;
  movementDate: Date;
  originWarehouseId?: number;
  destinationWarehouseId?: number;
  userId: number;
  approvalUserId: number;
  reason: string;
  notes?: string;
  details: CreateMovementDetailDto[];
}
