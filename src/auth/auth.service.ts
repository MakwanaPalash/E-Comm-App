import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { Messages } from '../helper/resource/en';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(Messages.ERROR.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const { phone, ...restDto } = createUserDto;
    const user = this.usersRepository.create({
      ...restDto,
      password: hashedPassword,
      phone: phone ? Number(phone) : undefined,
    });

    const savedUser = await this.usersRepository.save(user) as User;
    const { password, ...userWithoutPassword } = savedUser;

    const token = this.jwtService.sign({
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    });

    return { user: userWithoutPassword, token };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException(Messages.ERROR.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(Messages.ERROR.INVALID_CREDENTIALS);
    }

    const { password, ...userWithoutPassword } = user;

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: userWithoutPassword, token };
  }

  async logout(userId?: string, userEmail?: string): Promise<boolean> {
 
    if (userId || userEmail) {
      console.log(`User logged out: ${userEmail || userId}`);
    }
    
    return true;
  }
}
