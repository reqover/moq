import { Controller, Get, Route } from 'tsoa';

export interface Result {
  status: string;
  message: string;
}

@Route('/')
export class IndexController extends Controller {
  @Get('status')
  public async status(): Promise<Result> {
    return { status: 'OK', message: 'Moq is up and ready to work!!!' };
  }

  @Get()
  public async index(): Promise<Result> {
    return { status: 'OK', message: 'Moq is up and ready to work!!!' };
  }
}
