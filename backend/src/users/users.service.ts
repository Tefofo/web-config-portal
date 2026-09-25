import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { RequestUser } from '../common/types/request-context';
import { requireTenant } from '../common/guards/tenant.guard';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';

/** User shape safe to return over the API (never includes passwordHash). */
export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
  ) {}

  async list(user: RequestUser, query: UserQueryDto): Promise<PaginatedResult<PublicUser>> {
    const tenantId = requireTenant(user);
    const where: Prisma.UserWhereInput = { tenantId };
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(items.map(toPublicUser), total, query.page, query.limit);
  }

  async get(user: RequestUser, id: string): Promise<PublicUser> {
    return toPublicUser(await this.findScoped(user, id));
  }

  async create(user: RequestUser, dto: CreateUserDto): Promise<PublicUser> {
    const tenantId = requireTenant(user);
    if (dto.role === UserRole.PLATFORM_ADMIN) {
      throw new BadRequestException('Cannot assign the platform administrator role.');
    }
    const clash = await this.prisma.user.findFirst({ where: { tenantId, email: dto.email } });
    if (clash) {
      throw new ConflictException('A user with this email already exists.');
    }
    await this.usage.assertWithinLimit(tenantId, 'user');

    const created = await this.prisma.user.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        role: dto.role,
        status: dto.status ?? UserStatus.ACTIVE,
        passwordHash: await bcrypt.hash(dto.password, 10),
      },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: created.id,
      description: `Created user ${created.email}.`,
    });
    return toPublicUser(created);
  }

  async update(user: RequestUser, id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const tenantId = requireTenant(user);
    const existing = await this.findScoped(user, id);
    if (dto.role === UserRole.PLATFORM_ADMIN) {
      throw new BadRequestException('Cannot assign the platform administrator role.');
    }
    const roleChanged = dto.role !== undefined && dto.role !== existing.role;
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        status: dto.status,
      },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: roleChanged ? 'ROLE_CHANGED' : 'USER_UPDATED',
      entity: 'USER',
      entityId: id,
      description: `Updated user ${updated.email}.`,
    });
    return toPublicUser(updated);
  }

  async setStatus(user: RequestUser, id: string, status: UserStatus): Promise<PublicUser> {
    const tenantId = requireTenant(user);
    await this.findScoped(user, id);
    const updated = await this.prisma.user.update({ where: { id }, data: { status } });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: status === UserStatus.ACTIVE ? 'USER_ACTIVATED' : 'USER_DISABLED',
      entity: 'USER',
      entityId: id,
      description: `${status === UserStatus.ACTIVE ? 'Activated' : 'Deactivated'} user ${updated.email}.`,
    });
    return toPublicUser(updated);
  }

  private async findScoped(user: RequestUser, id: string): Promise<User> {
    const tenantId = requireTenant(user);
    const found = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!found) {
      throw new NotFoundException('User not found.');
    }
    return found;
  }
}

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  void _passwordHash;
  return rest;
}
