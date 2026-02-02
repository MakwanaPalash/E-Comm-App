import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro', description: 'Product name', minLength: 2, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Latest iPhone with advanced features', description: 'Product description', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 999.99, description: 'Product price', minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 50, description: 'Stock quantity', minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  stock: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Category UUID' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'Subcategory UUID' })
  @IsUUID()
  @IsNotEmpty()
  subcategoryId: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Product image file (JPEG, PNG, or WebP, max 5MB)',
  })
  @IsOptional()
  image?: any; // This is for Swagger documentation only, actual file is handled by FileInterceptor
}
