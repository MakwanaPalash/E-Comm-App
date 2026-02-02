import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { Messages } from '../helper/resource/en';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(
    pagination: boolean = false,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<
    | { categories: Category[]; total: number; page: number; limit: number }
    | Category[]
  > {
    const queryBuilder = this.categoriesRepository.createQueryBuilder('category');

    // Add search filter on name
    if (search) {
      queryBuilder.where('category.name LIKE :search', { search: `%${search}%` });
    }

    if (pagination) {
      const [categories, total] = await queryBuilder
        .orderBy('category.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        categories,
        total,
        page,
        limit,
      };
    } else {
      const categories = await queryBuilder
        .orderBy('category.createdAt', 'DESC')
        .getMany();
      return categories;
    }
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(Messages.ERROR.CATEGORY_NOT_FOUND);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(Messages.ERROR.CATEGORY_NOT_FOUND);
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(Messages.ERROR.CATEGORY_NOT_FOUND);
    }

    await this.categoriesRepository.remove(category);
  }
}
