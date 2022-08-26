import { IsString } from 'class-validator';

export class CreateServerDto {
  public email: string;

  @IsString()
  public password: string;
}
