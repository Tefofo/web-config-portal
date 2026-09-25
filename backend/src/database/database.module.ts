import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global module exposing the PrismaService to every feature module. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
