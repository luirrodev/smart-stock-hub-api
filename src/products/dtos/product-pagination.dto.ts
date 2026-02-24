import { IsOptional, IsIn } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';

export class ProductPaginationDto extends PaginationDto {
  @IsOptional()
  @IsIn(['id', 'name', 'price'])
  declare sortBy?: 'id' | 'name' | 'price';
}
