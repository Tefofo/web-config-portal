import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class CreateApplicationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'customer-portal' })
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{1,40}$/, {
    message: 'code must be lowercase letters, numbers or hyphens (e.g. customer-portal)',
  })
  code!: string;

  @ApiProperty()
  @IsString()
  environmentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}

// code and environmentId are immutable after creation.
export class UpdateApplicationDto extends PartialType(
  OmitType(CreateApplicationDto, ['code', 'environmentId'] as const),
) {}
