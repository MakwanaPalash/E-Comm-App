import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ParseFormDataPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Only process body parameters - skip param, query, custom, etc.
    if (metadata.type !== 'body') {
      // Skip logging for file parameters to reduce noise
      return value;
    }
    
    // Log what we receive for body only
    console.log('ParseFormDataPipe - Raw body value:', value);
    console.log('ParseFormDataPipe - Metadata:', metadata);
    
    if (!value || typeof value !== 'object') {
      console.log('ParseFormDataPipe - Value is not an object, returning as-is');
      return value;
    }

    // Check if the entire value is a file object (Multer file)
    // File objects have specific properties: fieldname, originalname, encoding, mimetype, buffer/stream/path, size
    if (this.isFileObject(value)) {
      console.log('ParseFormDataPipe - Value is a file object, returning as-is (preserving buffer)');
      return value;
    }

    const transformed: any = {};

    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        const val = value[key];
        
        // Skip file fields (they're handled by FileInterceptor)
        // Multer file objects have properties like fieldname, originalname, etc.
        if (this.isFileObject(val)) {
          console.log(`ParseFormDataPipe - Skipping file field: ${key} (preserving for FileInterceptor)`);
          // Don't include file fields in transformed object - they're handled separately by FileInterceptor
          continue;
        }

        // Skip undefined or null values
        if (val === undefined || val === null) {
          console.log(`ParseFormDataPipe - Skipping undefined/null field: ${key}`);
          continue;
        }

        // Try to parse numbers
        if (typeof val === 'string') {
          const trimmed = val.trim();
          // Check if it's a number (including decimals and negative numbers)
          if (trimmed !== '' && /^-?\d+\.?\d*$/.test(trimmed)) {
            const numVal = parseFloat(trimmed);
            transformed[key] = isNaN(numVal) ? val : numVal;
            console.log(`ParseFormDataPipe - Converted ${key}: "${val}" -> ${transformed[key]}`);
          } else if (trimmed === '') {
            // Skip empty strings for optional fields
            console.log(`ParseFormDataPipe - Skipping empty field: ${key}`);
            continue;
          } else {
            transformed[key] = val;
            console.log(`ParseFormDataPipe - Keeping string field: ${key} = "${val}"`);
          }
        } else {
          transformed[key] = val;
          console.log(`ParseFormDataPipe - Keeping non-string field: ${key} =`, val);
        }
      }
    }

    console.log('ParseFormDataPipe - Transformed result:', transformed);
    return transformed;
  }

  /**
   * Check if a value is a Multer file object
   * Multer file objects have: fieldname, originalname, encoding, mimetype, and either buffer, stream, or path
   */
  private isFileObject(value: any): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }
    
    // Check for Multer file object characteristics
    const hasFieldname = typeof value.fieldname === 'string';
    const hasOriginalname = typeof value.originalname === 'string';
    const hasMimetype = typeof value.mimetype === 'string';
    const hasFileData = !!(value.buffer || value.stream || value.path);
    
    return hasFieldname && hasOriginalname && hasMimetype && hasFileData;
  }
}
