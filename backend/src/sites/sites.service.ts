import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SiteConfig, TenantStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/types/request-context';
import { requireTenant } from '../common/guards/tenant.guard';
import { emptySiteDocument, SiteDocument } from './site-document';
import { UpdateSiteDto } from './dto/site.dto';

export interface SiteView {
  /** Tenant slug — used by the portal to build the public preview URL. */
  slug: string;
  template: string;
  published: boolean;
  content: SiteDocument;
  updatedAt: Date;
}

export interface PublicSiteView {
  siteName: string;
  template: string;
  content: SiteDocument;
}

@Injectable()
export class SitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Returns the editing view for the caller's tenant, creating a blank one if absent. */
  async getForTenant(user: RequestUser): Promise<SiteView> {
    const tenantId = requireTenant(user);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    let site = await this.prisma.siteConfig.findUnique({ where: { tenantId } });
    if (!site) {
      site = await this.prisma.siteConfig.create({
        data: {
          tenantId,
          content: emptySiteDocument(tenant?.name ?? 'My Website') as unknown as Prisma.InputJsonValue,
        },
      });
    }
    return this.toView(site, tenant?.slug ?? '');
  }

  async update(user: RequestUser, dto: UpdateSiteDto): Promise<SiteView> {
    const tenantId = requireTenant(user);
    this.assertValidDocument(dto.content);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    const site = await this.prisma.siteConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        content: dto.content as unknown as Prisma.InputJsonValue,
        published: dto.published ?? false,
      },
      update: {
        content: dto.content as unknown as Prisma.InputJsonValue,
        ...(dto.published === undefined ? {} : { published: dto.published }),
      },
    });

    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'UPDATE',
      entity: 'SITE',
      entityId: site.id,
      description: 'Updated website configuration.',
    });
    return this.toView(site, tenant?.slug ?? '');
  }

  /**
   * Public, unauthenticated read used by the site renderer. Only returns a
   * PUBLISHED site for an ACTIVE tenant, looked up by tenant slug. Returns 404
   * otherwise (does not leak whether an unpublished/suspended site exists).
   */
  async getPublicBySlug(slug: string): Promise<PublicSiteView> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new NotFoundException('Site not found.');
    }
    const site = await this.prisma.siteConfig.findUnique({ where: { tenantId: tenant.id } });
    if (!site || !site.published) {
      throw new NotFoundException('Site not found.');
    }
    return {
      siteName: tenant.name,
      template: site.template,
      content: site.content as unknown as SiteDocument,
    };
  }

  private assertValidDocument(content: unknown): asserts content is SiteDocument {
    const doc = content as Partial<SiteDocument> | null;
    if (
      !doc ||
      typeof doc !== 'object' ||
      !doc.branding ||
      !doc.hero ||
      !doc.sections ||
      !Array.isArray(doc.events) ||
      !Array.isArray(doc.gallery)
    ) {
      throw new BadRequestException('Invalid site document structure.');
    }
  }

  private toView(site: SiteConfig, slug: string): SiteView {
    return {
      slug,
      template: site.template,
      published: site.published,
      content: site.content as unknown as SiteDocument,
      updatedAt: site.updatedAt,
    };
  }
}
