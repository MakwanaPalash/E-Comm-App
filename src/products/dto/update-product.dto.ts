import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsUUID,
  IsNumber,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ example: 'iPhone 15 Pro', description: 'Product name', minLength: 2, maxLength: 200 })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Latest iPhone with advanced features', description: 'Product description', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 999.99, description: 'Product price', minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 50, description: 'Stock quantity', minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Category UUID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'Subcategory UUID' })
  @IsUUID()
  @IsOptional()
  subcategoryId?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Product image file (JPEG, PNG, or WebP, max 5MB). Leave empty to keep existing image.',
  })
  @IsOptional()
  image?: any; // This is for Swagger documentation only, actual file is handled by FileInterceptor
}
