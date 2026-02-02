import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from '../services/encryption.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_ENCRYPTION_KEY } from '../decorators/skip-encryption.decorator';
import { REQUIRE_ENCRYPTION_KEY } from '../decorators/require-encryption.decorator';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  constructor(
    private encryptionService: EncryptionService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const skipEncryption = this.reflector.getAllAndOverride<boolean>(SKIP_ENCRYPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requireEncryption = this.reflector.getAllAndOverride<boolean>(REQUIRE_ENCRYPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check for file uploads by Content-Type header (more reliable than request.file
    // since FileInterceptor runs after this interceptor)
    const contentType = request.headers?.['content-type'] || '';
    const isFileUpload = request.file || request.files || contentType.includes('multipart/form-data');
    
    // Only encrypt if explicitly required, not by default
    // Never encrypt public routes, file uploads, or when explicitly skipped
    const shouldEncrypt = requireEncryption && !isPublic && !isFileUpload && !skipEncryption;

    if (shouldEncrypt && request.body && request.body.encrypted) {
      try {
        const decrypted = this.encryptionService.decrypt(
          request.body.encrypted,
          request.body.iv,
        );
        request.body = JSON.parse(decrypted);
      } catch (error) {
        throw new Error('Invalid encrypted request format');
      }
    }

    return next.handle().pipe(
      map((data) => {
        if (shouldEncrypt && data) {
          try {
            // Additional safety check: ensure data is not null/undefined
            if (data === null || data === undefined) {
              console.error('EncryptionInterceptor: Data is null or undefined');
              return data;
            }
            
            const jsonString = JSON.stringify(data);
            // Safety check: ensure jsonString is actually a string
            // JSON.stringify can return undefined for certain inputs (though rare)
            if (jsonString === undefined || jsonString === null || typeof jsonString !== 'string') {
              console.error('EncryptionInterceptor: JSON.stringify returned invalid value', { data, jsonString });
              return data; // Return unencrypted if stringify fails
            }
            
            // Additional check: ensure jsonString is not empty (though empty string is valid)
            if (jsonString.length === 0) {
              console.warn('EncryptionInterceptor: JSON.stringify returned empty string');
              return data; // Return unencrypted if empty
            }
            
            return this.encryptionService.encrypt(jsonString);
          } catch (error) {
            // Handle circular references or other JSON.stringify errors
            console.error('EncryptionInterceptor: Failed to stringify data', error);
            return data; // Return unencrypted if stringify fails
          }
        }
        return data;
      }),
    );
  }
}
