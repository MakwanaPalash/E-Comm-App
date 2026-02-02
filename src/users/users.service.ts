import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { Messages } from '../helper/resource/en';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(
    pagination: boolean = false,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<
    | { users: Omit<User, 'password'>[]; total: number; page: number; limit: number }
    | Omit<User, 'password'>[]
  > {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.USER });

    // Add search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search OR CAST(user.phone AS CHAR) LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (pagination) {
      const [users, total] = await queryBuilder
        .orderBy('user.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const usersWithoutPassword = users.map(({ password, ...user }) => user);
      return {
        users: usersWithoutPassword,
        total,
        page,
        limit,
      };
    } else {
      const users = await queryBuilder.orderBy('user.createdAt', 'DESC').getMany();
      return users.map(({ password, ...user }) => user);
    }
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(Messages.ERROR.USER_NOT_FOUND);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(Messages.ERROR.USER_NOT_FOUND);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Convert phone string to number if provided
    const { phone, ...restDto } = updateUserDto;
    const updateData: Partial<User> = { ...restDto };
    if (phone !== undefined) {
      updateData.phone = phone ? Number(phone) : undefined;
    }

    Object.assign(user, updateData);
    const updatedUser = await this.usersRepository.save(user);

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(Messages.ERROR.USER_NOT_FOUND);
    }

    await this.usersRepository.remove(user);
  }
}
