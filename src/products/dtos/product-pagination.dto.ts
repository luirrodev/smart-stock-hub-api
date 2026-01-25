import { IsOptional, IsIn } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';

export class ProductPaginationDto extends PaginationDto {
  @IsOptional()
  @IsIn(['id', 'name', 'salePrice'])
  declare sortBy?: 'id' | 'name' | 'salePrice';
}
