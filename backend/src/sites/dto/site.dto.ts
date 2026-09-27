import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';
import { SiteDocument } from '../site-document';

/**
 * Update payload for a tenant's site. `content` is validated structurally in
 * the service against the SiteDocument shape; here we only assert it is an
 * object so class-validator lets it through.
 */
export class UpdateSiteDto {
  @ApiProperty({ description: 'Full marketing site document.' })
  @IsObject()
  content!: SiteDocument;

  @ApiPropertyOptional({ description: 'Publish/unpublish the public site.' })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
