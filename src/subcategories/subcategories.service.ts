import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { Subcategory } from './entities/subcategory.entity';
import { CategoriesService } from '../categories/categories.service';
import { Messages } from '../helper/resource/en';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory)
    private subcategoriesRepository: Repository<Subcategory>,
    private categoriesService: CategoriesService,
  ) {}

  async create(createSubcategoryDto: CreateSubcategoryDto): Promise<Subcategory> {
    const category = await this.categoriesService.findOne(createSubcategoryDto.categoryId);
    if (!category) {
      throw new BadRequestException(Messages.ERROR.INVALID_CATEGORY);
    }

    const subcategory = this.subcategoriesRepository.create(createSubcategoryDto);
    return this.subcategoriesRepository.save(subcategory);
  }

  async findAll(
    pagination: boolean = false,
    page: number = 1,
    limit: number = 10,
    categoryId?: string,
    search?: string,
  ): Promise<
    | { subcategories: Subcategory[]; total: number; page: number; limit: number }
    | Subcategory[]
  > {
    const queryBuilder = this.subcategoriesRepository
      .createQueryBuilder('subcategory')
      .leftJoinAndSelect('subcategory.category', 'category');

    // Add category filter
    if (categoryId) {
      queryBuilder.where('subcategory.categoryId = :categoryId', { categoryId });
    }

    // Add search filter on name
    if (search) {
      if (categoryId) {
        queryBuilder.andWhere('subcategory.name LIKE :search', { search: `%${search}%` });
      } else {
        queryBuilder.where('subcategory.name LIKE :search', { search: `%${search}%` });
      }
    }

    if (pagination) {
      const [subcategories, total] = await queryBuilder
        .orderBy('subcategory.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        subcategories,
        total,
        page,
        limit,
      };
    } else {
      const subcategories = await queryBuilder
        .orderBy('subcategory.createdAt', 'DESC')
        .getMany();
      return subcategories;
    }
  }

  async findOne(id: string): Promise<Subcategory> {
    const subcategory = await this.subcategoriesRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!subcategory) {
      throw new NotFoundException(Messages.ERROR.SUBCATEGORY_NOT_FOUND);
    }

    return subcategory;
  }

  async update(id: string, updateSubcategoryDto: UpdateSubcategoryDto): Promise<Subcategory> {
    const subcategory = await this.subcategoriesRepository.findOne({ where: { id } });

    if (!subcategory) {
      throw new NotFoundException(Messages.ERROR.SUBCATEGORY_NOT_FOUND);
    }

    if (updateSubcategoryDto.categoryId) {
      const category = await this.categoriesService.findOne(updateSubcategoryDto.categoryId);
      if (!category) {
        throw new BadRequestException(Messages.ERROR.INVALID_CATEGORY);
      }
    }

    Object.assign(subcategory, updateSubcategoryDto);
    return this.subcategoriesRepository.save(subcategory);
  }

  async remove(id: string): Promise<void> {
    const subcategory = await this.subcategoriesRepository.findOne({ where: { id } });

    if (!subcategory) {
      throw new NotFoundException(Messages.ERROR.SUBCATEGORY_NOT_FOUND);
    }

    await this.subcategoriesRepository.remove(subcategory);
  }
}
