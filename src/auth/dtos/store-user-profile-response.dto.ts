import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for recent orders in customer profile
 */
export class RecentOrderDto {
  @ApiProperty({
    description: 'Order ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Order number (customer-visible)',
    example: 'ORD-001',
  })
  orderNumber: string;

  @ApiProperty({
    description: 'Total order amount',
    example: 50.0,
  })
  total: number;

  @ApiProperty({
    description: 'Current order status',
    example: 'Delivered',
  })
  status: string;

  @ApiProperty({
    description: 'Order creation date',
    example: '2024-02-10T09:45:00Z',
  })
  createdAt: Date;
}

/**
 * DTO for purchase statistics in this store
 */
export class PurchaseStatsDto {
  @ApiProperty({
    description: 'Total number of orders placed in this store',
    example: 3,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Total amount spent in this store',
    example: 150.0,
  })
  totalSpent: number;

  @ApiProperty({
    description: 'Average value per order in this store',
    example: 50.0,
  })
  averageOrderValue: number;

  @ApiProperty({
    description: 'Payment success rate as percentage',
    example: '100%',
  })
  paymentSuccessRate: string;
}

/**
 * DTO for purchase statistics wrapper
 */
export class StatsDto {
  @ApiProperty({
    type: PurchaseStatsDto,
    description: 'Purchase statistics for this store',
  })
  purchases: PurchaseStatsDto;
}

/**
 * DTO for active shopping cart information
 */
export class CartInfoDto {
  @ApiProperty({
    description: 'Cart unique identifier',
    example: 'cart-uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Number of items in the cart',
    example: 2,
  })
  itemsCount: number;

  @ApiProperty({
    description: 'Total cart value',
    example: 49.99,
  })
  total: number;

  @ApiProperty({
    description: 'Last time cart was modified',
    example: '2024-02-20T11:20:00Z',
  })
  lastActivityAt: Date;
}

/**
 * DTO for shipping-related information
 */
export class ShippingInfoDto {
  @ApiProperty({
    description: 'Number of saved shipping addresses',
    example: 2,
  })
  savedAddresses: number;
}

/**
 * DTO for Store User (Customer) Profile Response
 * Contains personal information, purchase statistics, cart status, and recent orders
 * This is specific to the current store context
 */
export class StoreUserProfileResponseDto {
  @ApiProperty({
    description: 'StoreUser ID (credentials for this store)',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User ID (global unique identifier)',
    example: 5,
  })
  userId: number;

  @ApiProperty({
    description: 'Customer ID',
    example: 10,
  })
  customerId: number;

  @ApiProperty({
    description: 'Store ID for this session context',
    example: 1,
  })
  storeId: number;

  @ApiProperty({
    description: 'Store name',
    example: 'Main Store',
  })
  storeName: string;

  @ApiProperty({
    description: "Customer's first name",
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: "Customer's last name",
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: "Customer's email address",
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Role identifier',
    example: 'customer',
  })
  role: string;

  @ApiProperty({
    description: 'Whether the account is active in this store',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Last login timestamp for this store',
    example: '2024-02-15T14:30:00Z',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @ApiProperty({
    description: 'Account registration date for this store',
    example: '2024-01-15T10:00:00Z',
  })
  registeredAt: Date;

  @ApiProperty({
    type: StatsDto,
    description: 'Purchase statistics specific to this store',
  })
  stats: StatsDto;

  @ApiProperty({
    type: CartInfoDto,
    description: 'Active shopping cart information in this store',
    nullable: true,
  })
  cart: CartInfoDto | null;

  @ApiProperty({
    type: ShippingInfoDto,
    description: 'Shipping-related information',
  })
  shipping: ShippingInfoDto;

  @ApiProperty({
    type: [RecentOrderDto],
    description: 'Last 5 orders placed in this store',
    isArray: true,
  })
  recentOrders: RecentOrderDto[];
}
