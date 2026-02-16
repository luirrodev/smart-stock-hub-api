import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { ComponentResponseDto } from './component-response.dto';

export class ComponentPaginatedResponse extends PaginatedResponse<ComponentResponseDto> {
  @ApiProperty({
    type: [ComponentResponseDto],
    description: 'Array de componentes',
  })
  declare data: ComponentResponseDto[];
}
