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
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { Public } from '../shared/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ResponseUtil } from '../helper/utils/response.util';
import { Messages } from '../helper/resource/en';

@ApiTags('subcategories')
@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new subcategory (Admin only)' })
  @ApiResponse({ status: 201, description: 'Subcategory created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid category ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBody({ type: CreateSubcategoryDto })
  async create(@Body() createSubcategoryDto: CreateSubcategoryDto) {
    const subcategory = await this.subcategoriesService.create(createSubcategoryDto);
    return ResponseUtil.success(subcategory, Messages.SUCCESS.SUBCATEGORY_CREATED);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all subcategories' })
  @ApiQuery({ name: 'pagination', required: false, type: Boolean, description: 'Enable pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (when pagination=true)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (when pagination=true)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name' })
  @ApiResponse({ status: 200, description: 'List of subcategories' })
  async findAll(
    @Query('pagination', new ParseBoolPipe({ optional: true })) pagination: boolean = false,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.subcategoriesService.findAll(pagination, page, limit, categoryId, search);
    
    if (pagination) {
      return ResponseUtil.paginated(
        (result as any).subcategories,
        (result as any).total,
        (result as any).page,
        (result as any).limit,
        Messages.SUCCESS.SUBCATEGORIES_RETRIEVED,
      );
    } else {
      return ResponseUtil.success(result, Messages.SUCCESS.SUBCATEGORIES_RETRIEVED);
    }
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get subcategory by ID' })
  @ApiResponse({ status: 200, description: 'Subcategory retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  async findOne(@Param('id') id: string) {
    const subcategory = await this.subcategoriesService.findOne(id);
    return ResponseUtil.success(subcategory, Messages.SUCCESS.SUBCATEGORY_RETRIEVED);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update subcategory (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subcategory updated successfully' })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBody({ type: UpdateSubcategoryDto })
  async update(@Param('id') id: string, @Body() updateSubcategoryDto: UpdateSubcategoryDto) {
    const subcategory = await this.subcategoriesService.update(id, updateSubcategoryDto);
    return ResponseUtil.success(subcategory, Messages.SUCCESS.SUBCATEGORY_UPDATED);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete subcategory (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subcategory deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subcategory not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async remove(@Param('id') id: string) {
    await this.subcategoriesService.remove(id);
    return ResponseUtil.success(null, Messages.SUCCESS.SUBCATEGORY_DELETED);
  }
}
