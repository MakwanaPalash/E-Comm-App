import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ShareableLink, LinkType } from './entities/shareable-link.entity';
import { CategoriesService } from '../categories/categories.service';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import { ImageService } from '../shared/services/image.service';
import { Messages } from '../helper/resource/en';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ShareableLink)
    private shareableLinkRepository: Repository<ShareableLink>,
    private categoriesService: CategoriesService,
    private subcategoriesService: SubcategoriesService,
    private imageService: ImageService,
    private configService: ConfigService,
  ) {}

  /**
   * Transform image path to full URL
   * Handles both relative paths (from database) and already full URLs
   */
  private transformImageUrl(product: Product): Product {
    if (product.imagePath) {
      // If already a full URL, return as-is
      if (product.imagePath.startsWith('http://') || product.imagePath.startsWith('https://')) {
        return product;
      }
      
      // Construct full URL from relative path
      const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
      
      // Clean the path: remove leading/trailing slashes and /public/ prefix if present
      let cleanPath = product.imagePath.trim();
      if (cleanPath.startsWith('/public/')) {
        cleanPath = cleanPath.substring(7); // Remove /public/ prefix
      } else if (cleanPath.startsWith('public/')) {
        cleanPath = cleanPath.substring(7); // Remove public/ prefix
      }
      // Remove leading slash if present
      if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
      }
      
      // Construct URL: baseUrl + /public/ + cleanPath
      // Ensure no double slashes
      const baseUrlClean = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      product.imagePath = `${baseUrlClean}/public/${cleanPath}`;
    }
    return product;
  }

  async create(
    createProductDto: CreateProductDto,
    file?: Express.Multer.File,
  ): Promise<Product> {
    const category = await this.categoriesService.findOne(createProductDto.categoryId);
    if (!category) {
      throw new BadRequestException(Messages.ERROR.INVALID_CATEGORY);
    }

    const subcategory = await this.subcategoriesService.findOne(createProductDto.subcategoryId);
    if (!subcategory) {
      throw new BadRequestException(Messages.ERROR.INVALID_SUBCATEGORY);
    }

    if (subcategory.categoryId !== createProductDto.categoryId) {
      throw new BadRequestException(Messages.ERROR.CATEGORY_SUBCATEGORY_MISMATCH);
    }

    const product = this.productsRepository.create(createProductDto);
    // Save product first to get the ID
    const savedProduct = await this.productsRepository.save(product);

    if (file) {
      // Upload image and store path (similar to minemend pattern)
      savedProduct.imagePath = await this.imageService.uploadImage(file, savedProduct.id);
      const updatedProduct = await this.productsRepository.save(savedProduct);
      return this.transformImageUrl(updatedProduct);
    }

    return this.transformImageUrl(savedProduct);
  }

  async findAll(
    pagination: boolean = false,
    page: number = 1,
    limit: number = 10,
    categoryId?: string,
    subcategoryId?: string,
    search?: string,
  ): Promise<
    | { products: Product[]; total: number; page: number; limit: number }
    | Product[]
  > {
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory');

    // Add category filter
    if (categoryId) {
      queryBuilder.where('product.categoryId = :categoryId', { categoryId });
    }

    // Add subcategory filter
    if (subcategoryId) {
      if (categoryId) {
        queryBuilder.andWhere('product.subcategoryId = :subcategoryId', { subcategoryId });
      } else {
        queryBuilder.where('product.subcategoryId = :subcategoryId', { subcategoryId });
      }
    }

    // Add search filter on name
    if (search) {
      if (categoryId || subcategoryId) {
        queryBuilder.andWhere('product.name LIKE :search', { search: `%${search}%` });
      } else {
        queryBuilder.where('product.name LIKE :search', { search: `%${search}%` });
      }
    }

    if (pagination) {
      const [products, total] = await queryBuilder
        .orderBy('product.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const transformedProducts = products.map(p => this.transformImageUrl(p));
      return {
        products: transformedProducts,
        total,
        page,
        limit,
      };
    } else {
      const products = await queryBuilder
        .orderBy('product.createdAt', 'DESC')
        .getMany();
      return products.map(p => this.transformImageUrl(p));
    }
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'subcategory'],
    });

    if (!product) {
      throw new NotFoundException(Messages.ERROR.PRODUCT_NOT_FOUND);
    }

    return this.transformImageUrl(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    file?: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.productsRepository.findOne({ 
      where: { id },
      relations: ['category', 'subcategory'],
    });

    if (!product) {
      throw new NotFoundException(Messages.ERROR.PRODUCT_NOT_FOUND);
    }

    if (updateProductDto.categoryId) {
      const category = await this.categoriesService.findOne(updateProductDto.categoryId);
      if (!category) {
        throw new BadRequestException(Messages.ERROR.INVALID_CATEGORY);
      }
    }

    if (updateProductDto.subcategoryId) {
      const subcategory = await this.subcategoriesService.findOne(updateProductDto.subcategoryId);
      if (!subcategory) {
        throw new BadRequestException(Messages.ERROR.INVALID_SUBCATEGORY);
      }

      const finalCategoryId = updateProductDto.categoryId || product.categoryId;
      if (subcategory.categoryId !== finalCategoryId) {
        throw new BadRequestException(Messages.ERROR.CATEGORY_SUBCATEGORY_MISMATCH);
      }
    }

    if (file) {
      // Delete old image if exists (similar to minemend pattern)
      if (product.imagePath) {
        await this.imageService.deleteImage(product.imagePath);
      }
      // Upload new image and store path
      product.imagePath = await this.imageService.uploadImage(file, product.id);
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productsRepository.save(product);
    return this.transformImageUrl(updatedProduct);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(Messages.ERROR.PRODUCT_NOT_FOUND);
    }

    if (product.imagePath) {
      await this.imageService.deleteProductImages(id);
    }

    // Delete associated shareable links
    await this.shareableLinkRepository.delete({ productId: id });

    await this.productsRepository.remove(product);
  }

  /**
   * Generate a unique token for shareable links
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a shareable link for a product
   */
  async generateShareLink(
    productId: string,
    type: LinkType,
    expiresAt?: Date,
  ): Promise<{ link: ShareableLink; shareUrl: string }> {
    const product = await this.findOne(productId);

    // Check if a link of this type already exists for this product
    const existingLink = await this.shareableLinkRepository.findOne({
      where: { productId, type },
    });

    let shareableLink: ShareableLink;

    if (existingLink) {
      // Update existing link
      if (expiresAt) {
        existingLink.expiresAt = expiresAt;
      }
      shareableLink = await this.shareableLinkRepository.save(existingLink);
    } else {
      // Create new link
      const token = this.generateToken();
      shareableLink = this.shareableLinkRepository.create({
        productId: product.id,
        type,
        token,
        expiresAt,
      });
      shareableLink = await this.shareableLinkRepository.save(shareableLink);
    }

    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/products/share/${shareableLink.token}`;

    return { link: shareableLink, shareUrl };
  }

  /**
   * Validate and access a product via shareable link token
   */
  async accessProductByShareLink(token: string, isAuthenticated: boolean = false): Promise<Product> {
    const shareableLink = await this.shareableLinkRepository.findOne({
      where: { token },
      relations: ['product', 'product.category', 'product.subcategory'],
    });

    if (!shareableLink) {
      throw new NotFoundException('Shareable link not found or invalid');
    }

    // Check if link has expired
    if (shareableLink.expiresAt && new Date() > shareableLink.expiresAt) {
      throw new BadRequestException('Shareable link has expired');
    }

    // For private links, require authentication
    if (shareableLink.type === LinkType.PRIVATE && !isAuthenticated) {
      throw new UnauthorizedException('Authentication required to access this private link');
    }

    // Increment access count
    shareableLink.accessCount += 1;
    await this.shareableLinkRepository.save(shareableLink);

    return this.transformImageUrl(shareableLink.product);
  }

  /**
   * Get shareable link information by product ID
   */
  async getShareLinksByProduct(productId: string): Promise<ShareableLink[]> {
    await this.findOne(productId); // Verify product exists

    return this.shareableLinkRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete a shareable link
   */
  async deleteShareLink(linkId: string): Promise<void> {
    const link = await this.shareableLinkRepository.findOne({ where: { id: linkId } });

    if (!link) {
      throw new NotFoundException('Shareable link not found');
    }

    await this.shareableLinkRepository.remove(link);
  }
}
