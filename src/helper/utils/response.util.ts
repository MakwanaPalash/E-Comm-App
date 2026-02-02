import { HttpStatus } from '@nestjs/common';
import { SuccessResponse, ErrorResponse, PaginatedResponse } from '../interfaces/response.interface';

export class ResponseUtil {
  static success<T>(
    data: T,
    message: string,
    statusCode: HttpStatus = HttpStatus.OK,
  ): SuccessResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(
    message: string,
    error: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    path?: string,
  ): ErrorResponse {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: path || '',
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string,
    statusCode: HttpStatus = HttpStatus.OK,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
