import { Module } from '@nestjs/common';
import { ProvidersController, ProviderPublicController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  controllers: [ProvidersController, ProviderPublicController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}