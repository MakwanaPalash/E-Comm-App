import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LinkType } from '../entities/shareable-link.entity';

export class GenerateShareLinkDto {
  @ApiProperty({
    enum: LinkType,
    example: LinkType.PUBLIC,
    description: 'Type of share link: public or private',
  })
  @IsEnum(LinkType)
  type: LinkType;

  @ApiPropertyOptional({
    example: '2026-01-31T23:59:59Z',
    description: 'Optional expiration date for the link',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
