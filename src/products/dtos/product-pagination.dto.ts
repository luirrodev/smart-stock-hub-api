import { IsOptional, IsIn } from 'class-validator';
import { OmitType } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dtos/pagination.dto';

export class ProductPaginationDto extends OmitType(PaginationDto, ['search']) {
  @IsOptional()
  @IsIn(['id', 'name', 'price'])
  declare sortBy?: 'id' | 'name' | 'price';
}
