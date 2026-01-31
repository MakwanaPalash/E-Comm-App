import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ENCRYPTION_KEY = 'requireEncryption';
export const RequireEncryption = () => SetMetadata(REQUIRE_ENCRYPTION_KEY, true);
