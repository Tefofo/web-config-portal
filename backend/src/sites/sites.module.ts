import { Module } from '@nestjs/common';
import { PublicSitesController, SitesController } from './sites.controller';
import { SitesService } from './sites.service';

@Module({
  controllers: [SitesController, PublicSitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}
