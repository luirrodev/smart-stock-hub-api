import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { ProductListDto } from './product-response.dto';

export class ProductPaginatedResponse extends PaginatedResponse<ProductListDto> {
  @ApiProperty({
    type: [ProductListDto],
    description: 'Array de productos',
  })
  declare data: ProductListDto[];
}
