import { IsOptional, IsIn } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class ComponentPaginationDto extends PaginationDto {
  @IsOptional()
  @IsIn(['id', 'name', 'code', 'createdAt'])
  declare sortBy?: 'id' | 'name' | 'code' | 'createdAt';
}
