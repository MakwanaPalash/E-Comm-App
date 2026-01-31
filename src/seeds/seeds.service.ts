import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { UserSeed } from './user.seed';

@Injectable()
export class SeedsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seedUsers(): Promise<void> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: UserSeed.email },
      });

      if (existingUser) {
        console.log('Admin user already exists. Skipping.');
        return;
      }

      const hashedPassword = await bcrypt.hash(UserSeed.password, 10);

      const adminUser = this.userRepository.create({
        firstName: UserSeed.firstName,
        lastName: UserSeed.lastName,
        email: UserSeed.email,
        password: hashedPassword,
        role: UserRole.ADMIN,
      });

      await this.userRepository.save(adminUser);
      console.log('✅ Admin user seeded successfully');
      console.log(`   Email: ${UserSeed.email}`);
    } catch (error) {
      console.error('❌ Error seeding admin user:', error);
    }
  }
}
