import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Messages } from '../../helper/resource/en';

/**
 * ImageService - Handles image upload and management
 * Similar to minemend's S3Service but stores files locally in public folder
 * 
 * Directory structure:
 * public/
 *   images/
 *     products/
 *       {productId}/
 *         {timestamp}_{originalname}
 */
@Injectable()
export class ImageService {
  private readonly baseUploadPath: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    // Base path: public/images/products
    this.baseUploadPath = path.join(process.cwd(), 'public', 'images', 'products');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 5242880; // 5MB default
    this.allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // Ensure base directory exists
    this.ensureDirectoryExists(this.baseUploadPath);
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Validate file before upload
   * Similar to minemend's validation pattern
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException(Messages.ERROR.IMAGE_UPLOAD_FAILED || 'File is required');
    }

    // Check if file has buffer (memory storage) - required for local storage
    if (!file.buffer) {
      throw new BadRequestException('File data is missing. Buffer not available.');
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        Messages.ERROR.IMAGE_TOO_LARGE || 
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    // Validate MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        Messages.ERROR.INVALID_IMAGE_TYPE || 
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }
  }

  /**
   * Upload single image file
   * Similar to minemend's awsSingleUpload but for local storage
   * 
   * @param file - Multer file object
   * @param productId - Product ID for directory organization
   * @returns Relative path from public folder (e.g., "images/products/{productId}/{filename}")
   */
  async uploadImage(file: Express.Multer.File, productId: string): Promise<string> {
    this.validateFile(file);

    // Create product-specific directory
    const productDir = path.join(this.baseUploadPath, productId);
    this.ensureDirectoryExists(productDir);

    // Generate filename: timestamp_originalname (like minemend pattern)
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}_${sanitizedOriginalName}`;
    const filePath = path.join(productDir, filename);

    try {
      // Write file buffer to disk
      fs.writeFileSync(filePath, file.buffer);

      // Return relative path from public folder (for database storage)
      // Format: images/products/{productId}/{filename}
      const relativePath = path.relative(
        path.join(process.cwd(), 'public'),
        filePath
      ).replace(/\\/g, '/');

      return relativePath;
    } catch (error) {
      console.error('ImageService - Error saving file:', error);
      throw new BadRequestException('Failed to save image file');
    }
  }

  /**
   * Delete a single image file
   * Similar to minemend's awsDelete but for local storage
   * 
   * @param imagePath - Relative path from public folder (e.g., "images/products/{productId}/{filename}")
   */
  async deleteImage(imagePath: string): Promise<void> {
    if (!imagePath) {
      return;
    }

    // Construct full path
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        
        // Clean up empty product directory
        const productDir = path.dirname(fullPath);
        if (fs.existsSync(productDir) && fs.readdirSync(productDir).length === 0) {
          fs.rmdirSync(productDir);
        }
      }
    } catch (error) {
      console.error('ImageService - Error deleting file:', error);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Delete all images for a product
   * Removes the entire product directory
   * 
   * @param productId - Product ID
   */
  async deleteProductImages(productId: string): Promise<void> {
    const productDir = path.join(this.baseUploadPath, productId);
    
    try {
      if (fs.existsSync(productDir)) {
        fs.rmSync(productDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('ImageService - Error deleting product images:', error);
      throw new BadRequestException('Failed to delete product images');
    }
  }

  /**
   * Get full URL for an image path
   * Similar to how minemend constructs S3 URLs
   * 
   * @param imagePath - Relative path from public folder
   * @returns Full URL to access the image, or null if path is empty
   */
  getImageUrl(imagePath: string): string | null {
    if (!imagePath) {
      return null;
    }

    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    // Ensure path starts with /public/ for static file serving
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}/public${normalizedPath}`;
  }
}
