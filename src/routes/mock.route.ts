import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { MockController } from '@/controllers/mock.controller';

export class MockRoute implements Routes {
  public router = Router();
  public controller = new MockController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use('/:serverId/mock', this.controller.mockApi);
  }
}
