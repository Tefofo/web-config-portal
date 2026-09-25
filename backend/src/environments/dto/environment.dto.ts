import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EnvironmentStatus, EnvironmentType } from '@prisma/client';

export class CreateEnvironmentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'PROD' })
  @IsString()
  @Matches(/^[A-Z0-9_]{2,10}$/, { message: 'code must be 2-10 uppercase letters, numbers or underscores' })
  code!: string;

  @ApiProperty({ enum: EnvironmentType })
  @IsEnum(EnvironmentType)
  type!: EnvironmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: EnvironmentStatus })
  @IsOptional()
  @IsEnum(EnvironmentStatus)
  status?: EnvironmentStatus;
}

export class UpdateEnvironmentDto extends PartialType(CreateEnvironmentDto) {}
