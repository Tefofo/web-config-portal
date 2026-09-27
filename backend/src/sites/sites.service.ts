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
import { emptySiteDocument, SiteDocument, SiteTemplate } from './site-document';
import { UpdateSiteDto } from './dto/site.dto';

const VALID_TEMPLATES: SiteTemplate[] = ['marketing-v1', 'restaurant-v1'];

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
      const doc = emptySiteDocument('marketing-v1', tenant?.name ?? 'My Website');
      site = await this.prisma.siteConfig.create({
        data: {
          tenantId,
          template: doc.template,
          content: doc as unknown as Prisma.InputJsonValue,
        },
      });
    }
    return this.toView(site, tenant?.slug ?? '');
  }

  /**
   * Switches the tenant's site to a different template, replacing the content
   * with a blank document for that template (keeping the site name). Existing
   * content for the previous template is discarded.
   */
  async switchTemplate(user: RequestUser, template: SiteTemplate): Promise<SiteView> {
    const tenantId = requireTenant(user);
    if (!VALID_TEMPLATES.includes(template)) {
      throw new BadRequestException('Unknown template.');
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const existing = await this.prisma.siteConfig.findUnique({ where: { tenantId } });
    const currentName =
      (existing?.content as unknown as SiteDocument | undefined)?.branding.siteName ??
      tenant?.name ??
      'My Website';
    const doc = emptySiteDocument(template, currentName);

    const site = await this.prisma.siteConfig.upsert({
      where: { tenantId },
      create: { tenantId, template, content: doc as unknown as Prisma.InputJsonValue },
      update: { template, content: doc as unknown as Prisma.InputJsonValue, published: false },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'UPDATE',
      entity: 'SITE',
      entityId: site.id,
      description: `Switched website template to ${template}.`,
    });
    return this.toView(site, tenant?.slug ?? '');
  }

  async update(user: RequestUser, dto: UpdateSiteDto): Promise<SiteView> {
    const tenantId = requireTenant(user);
    this.assertValidDocument(dto.content);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    const template = dto.content.template;
    const site = await this.prisma.siteConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        template,
        content: dto.content as unknown as Prisma.InputJsonValue,
        published: dto.published ?? false,
      },
      update: {
        template,
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
      !doc.template ||
      !VALID_TEMPLATES.includes(doc.template as SiteTemplate) ||
      !doc.branding ||
      !doc.hero ||
      !doc.sections ||
      !Array.isArray(doc.gallery)
    ) {
      throw new BadRequestException('Invalid site document structure.');
    }
    if (doc.template === 'restaurant-v1') {
      const r = doc as Partial<import('./site-document').RestaurantSiteDocument>;
      if (!Array.isArray(r.menu) || !Array.isArray(r.hours) || !Array.isArray(r.amenities)) {
        throw new BadRequestException('Invalid restaurant site document structure.');
      }
    } else if (!Array.isArray((doc as { events?: unknown[] }).events)) {
      throw new BadRequestException('Invalid marketing site document structure.');
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
