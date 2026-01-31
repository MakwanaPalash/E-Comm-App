import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
  Request,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GenerateShareLinkDto } from './dto/generate-share-link.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { Public } from '../shared/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ResponseUtil } from '../helper/utils/response.util';
import { Messages } from '../helper/resource/en';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ParseFormDataPipe } from '../shared/pipes/parse-form-data.pipe';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  @UsePipes(new ParseFormDataPipe())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product with image (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid category/subcategory or file validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBody({ type: CreateProductDto })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Log received data for debugging
    console.log('Create Product DTO received:', createProductDto);
    console.log('File received:', file ? `${file.originalname} (${file.size} bytes)` : 'No file');
    
    const product = await this.productsService.create(createProductDto, file);
    return ResponseUtil.success(product, Messages.SUCCESS.PRODUCT_CREATED);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get products with pagination and filters' })
  @ApiQuery({ name: 'pagination', required: false, type: Boolean, description: 'Enable pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (when pagination=true)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (when pagination=true)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'subcategoryId', required: false, description: 'Filter by subcategory ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name' })
  @ApiResponse({ status: 200, description: 'List of products with pagination' })
  async findAll(
    @Query('pagination', new ParseBoolPipe({ optional: true })) pagination: boolean = false,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.productsService.findAll(pagination, page, limit, categoryId, subcategoryId, search);
    
    if (pagination) {
      return ResponseUtil.paginated(
        (result as any).products,
        (result as any).total,
        (result as any).page,
        (result as any).limit,
        Messages.SUCCESS.PRODUCTS_RETRIEVED,
      );
    } else {
      return ResponseUtil.success(result, Messages.SUCCESS.PRODUCTS_RETRIEVED);
    }
  }

  @Public()
  @Get('share/:token')
  @ApiOperation({ summary: 'Access product via shareable link (Public or Private)' })
  @ApiResponse({ status: 200, description: 'Product accessed via share link successfully' })
  @ApiResponse({ status: 400, description: 'Shareable link expired' })
  @ApiResponse({ status: 401, description: 'Authentication required for private link' })
  @ApiResponse({ status: 404, description: 'Shareable link not found' })
  async accessByShareLink(
    @Param('token') token: string,
    @Request() req: any,
  ) {
    // Manually validate JWT token if provided (for private links)
    let isAuthenticated = false;
    const authHeader = req.headers?.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwtToken = authHeader.substring(7);
        const secret = this.configService.get<string>('JWT_SECRET');
        const payload = this.jwtService.verify(jwtToken, { secret });
        isAuthenticated = !!(payload && payload.sub);
      } catch (error) {
        // Token is invalid, but we'll let the service handle the authentication check
        isAuthenticated = false;
      }
    }
    
    const product = await this.productsService.accessProductByShareLink(token, isAuthenticated);
    return ResponseUtil.success(product, 'Product accessed via share link successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate a shareable link for a product' })
  @ApiResponse({ status: 201, description: 'Shareable link generated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiBody({ type: GenerateShareLinkDto })
  async generateShareLink(
    @Param('id') id: string,
    @Body() generateShareLinkDto: GenerateShareLinkDto,
  ) {
    const expiresAt = generateShareLinkDto.expiresAt
      ? new Date(generateShareLinkDto.expiresAt)
      : undefined;
    const result = await this.productsService.generateShareLink(
      id,
      generateShareLinkDto.type,
      expiresAt,
    );
    return ResponseUtil.success(
      { link: result.link, shareUrl: result.shareUrl },
      'Shareable link generated successfully',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/share')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all shareable links for a product' })
  @ApiResponse({ status: 200, description: 'Shareable links retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getShareLinks(@Param('id') id: string) {
    const links = await this.productsService.getShareLinksByProduct(id);
    return ResponseUtil.success(links, 'Shareable links retrieved successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Delete('share/:linkId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a shareable link' })
  @ApiResponse({ status: 200, description: 'Shareable link deleted successfully' })
  @ApiResponse({ status: 404, description: 'Shareable link not found' })
  async deleteShareLink(@Param('linkId') linkId: string) {
    await this.productsService.deleteShareLink(linkId);
    return ResponseUtil.success(null, 'Shareable link deleted successfully');
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return ResponseUtil.success(product, Messages.SUCCESS.PRODUCT_RETRIEVED);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @UsePipes(new ParseFormDataPipe())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBody({ type: UpdateProductDto })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Log received data for debugging
    console.log('Update Product DTO received:', updateProductDto);
    console.log('File received:', file ? file.originalname : 'No file');
    
    const product = await this.productsService.update(id, updateProductDto, file);
    return ResponseUtil.success(product, Messages.SUCCESS.PRODUCT_UPDATED);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return ResponseUtil.success(null, Messages.SUCCESS.PRODUCT_DELETED);
  }
}
