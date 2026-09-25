import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ConfigurationStatus, ConfigurationType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { EmptyStringToUndefined } from '../../common/transforms/empty-to-undefined';

export class CreateConfigurationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'api.url' })
  @IsString()
  @Matches(/^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/, {
    message: 'key must be lowercase dot/underscore segments, e.g. feature.my_key',
  })
  key!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty()
  @IsString()
  environmentId!: string;

  @ApiProperty({ enum: ConfigurationType })
  @IsEnum(ConfigurationType)
  type!: ConfigurationType;

  // value/defaultValue are arbitrary JSON validated against `type` in the service.
  @ApiProperty()
  value!: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  defaultValue?: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ enum: ConfigurationStatus })
  @IsOptional()
  @IsEnum(ConfigurationStatus)
  status?: ConfigurationStatus;
}

// key and environmentId are immutable after creation.
export class UpdateConfigurationDto extends PartialType(
  OmitType(CreateConfigurationDto, ['key', 'environmentId'] as const),
) {}

export class DuplicateConfigurationDto {
  @ApiProperty({ example: 'api.url_copy' })
  @IsString()
  @Matches(/^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/)
  key!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class ConfigurationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @EmptyStringToUndefined()
  @IsString()
  environmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @EmptyStringToUndefined()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ConfigurationStatus })
  @IsOptional()
  @EmptyStringToUndefined()
  @IsEnum(ConfigurationStatus)
  status?: ConfigurationStatus;

  @ApiPropertyOptional({ enum: ConfigurationType })
  @IsOptional()
  @EmptyStringToUndefined()
  @IsEnum(ConfigurationType)
  type?: ConfigurationType;

  @ApiPropertyOptional()
  @IsOptional()
  @EmptyStringToUndefined()
  @IsString()
  ownerId?: string;
}
