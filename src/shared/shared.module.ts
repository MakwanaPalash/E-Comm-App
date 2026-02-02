import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { EncryptionInterceptor } from './interceptors/encryption.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({
  providers: [
    EncryptionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: EncryptionInterceptor,
    },
  ],
  exports: [EncryptionService],
})
export class SharedModule {}
