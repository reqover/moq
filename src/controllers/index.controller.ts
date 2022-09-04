// import { NextFunction, Request, Response } from 'express';
import { Controller, Get, Request, Res, Route, TsoaResponse } from 'tsoa';

export interface Result {
  status: string;
  message: string;
}

@Route('/')
export class IndexController extends Controller {
  @Get('status')
  public async index(): Promise<Result> {
    return { status: 'OK', message: 'Moq is up and ready to work!!!' };
  }
}
