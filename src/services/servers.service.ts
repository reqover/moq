import { hash } from 'bcrypt';
import { PrismaClient, User } from '@prisma/client';
import { CreateUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { isEmpty } from '@utils/util';

class ServerService {
  public users = new PrismaClient().user;

  // public async createServer(serverData: CreateUserDto): Promise<User> {
  //   if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

  //   const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
  //   if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

  //   const hashedPassword = await hash(userData.password, 10);
  //   const createUserData: User = await this.users.create({ data: { ...userData, password: hashedPassword } });
  //   return createUserData;
  // }
}

export default ServerService;
