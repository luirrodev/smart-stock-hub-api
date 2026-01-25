import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';

export const IS_OPTIONAL_KEY = 'isOptionalAuth';

export const OptionalAuth = () =>
  applyDecorators(
    SetMetadata(IS_OPTIONAL_KEY, true),
    UseGuards(OptionalAuthGuard),
  );
