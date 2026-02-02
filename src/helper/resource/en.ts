export const Messages = {
  // Success Messages
  SUCCESS: {
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',
    USER_RETRIEVED: 'User retrieved successfully',
    USERS_RETRIEVED: 'Users retrieved successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    REGISTRATION_SUCCESS: 'Registration successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    PROFILE_DELETED: 'Profile deleted successfully',
    
    CATEGORY_CREATED: 'Category created successfully',
    CATEGORY_UPDATED: 'Category updated successfully',
    CATEGORY_DELETED: 'Category deleted successfully',
    CATEGORY_RETRIEVED: 'Category retrieved successfully',
    CATEGORIES_RETRIEVED: 'Categories retrieved successfully',
    
    SUBCATEGORY_CREATED: 'Subcategory created successfully',
    SUBCATEGORY_UPDATED: 'Subcategory updated successfully',
    SUBCATEGORY_DELETED: 'Subcategory deleted successfully',
    SUBCATEGORY_RETRIEVED: 'Subcategory retrieved successfully',
    SUBCATEGORIES_RETRIEVED: 'Subcategories retrieved successfully',
    
    PRODUCT_CREATED: 'Product created successfully',
    PRODUCT_UPDATED: 'Product updated successfully',
    PRODUCT_DELETED: 'Product deleted successfully',
    PRODUCT_RETRIEVED: 'Product retrieved successfully',
    PRODUCTS_RETRIEVED: 'Products retrieved successfully',
  },

  // Error Messages
  ERROR: {
    // Authentication Errors
    INVALID_CREDENTIALS: 'Invalid credentials',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden - Insufficient permissions',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    
    // User Errors
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User with this email already exists',
    USER_UPDATE_FAILED: 'Failed to update user',
    USER_DELETE_FAILED: 'Failed to delete user',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
    INVALID_EMAIL: 'Invalid email format',
    
    // Category Errors
    CATEGORY_NOT_FOUND: 'Category not found',
    CATEGORY_ALREADY_EXISTS: 'Category with this name already exists',
    CATEGORY_UPDATE_FAILED: 'Failed to update category',
    CATEGORY_DELETE_FAILED: 'Failed to delete category',
    
    // Subcategory Errors
    SUBCATEGORY_NOT_FOUND: 'Subcategory not found',
    SUBCATEGORY_ALREADY_EXISTS: 'Subcategory with this name already exists',
    SUBCATEGORY_UPDATE_FAILED: 'Failed to update subcategory',
    SUBCATEGORY_DELETE_FAILED: 'Failed to delete subcategory',
    SUBCATEGORY_CATEGORY_MISMATCH: 'Subcategory does not belong to the specified category',
    
    // Product Errors
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_UPDATE_FAILED: 'Failed to update product',
    PRODUCT_DELETE_FAILED: 'Failed to delete product',
    INVALID_CATEGORY: 'Invalid category ID',
    INVALID_SUBCATEGORY: 'Invalid subcategory ID',
    CATEGORY_SUBCATEGORY_MISMATCH: 'Subcategory does not belong to the specified category',
    
    // Image Errors
    IMAGE_UPLOAD_FAILED: 'Failed to upload image',
    IMAGE_TOO_LARGE: 'Image size exceeds maximum allowed size',
    INVALID_IMAGE_TYPE: 'Invalid image type. Allowed types: jpg, jpeg, png, webp',
    IMAGE_NOT_FOUND: 'Image not found',
    IMAGE_DELETE_FAILED: 'Failed to delete image',
    
    // Validation Errors
    VALIDATION_ERROR: 'Validation failed',
    REQUIRED_FIELD: 'This field is required',
    INVALID_UUID: 'Invalid UUID format',
    INVALID_NUMBER: 'Invalid number format',
    MIN_VALUE_ERROR: 'Value is below minimum allowed',
    MAX_VALUE_ERROR: 'Value exceeds maximum allowed',
    STRING_TOO_SHORT: 'String is too short',
    STRING_TOO_LONG: 'String is too long',
    
    // Encryption Errors
    ENCRYPTION_FAILED: 'Failed to encrypt data',
    DECRYPTION_FAILED: 'Failed to decrypt data',
    INVALID_ENCRYPTED_FORMAT: 'Invalid encrypted request format',
    
    // General Errors
    INTERNAL_SERVER_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    BAD_REQUEST: 'Bad request',
    CONFLICT: 'Resource conflict',
  },
};
