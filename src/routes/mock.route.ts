import express, { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import { MockController } from '../controllers/mock.controller';
import { MOCKS_DIR } from '../config';
import serveIndex from 'serve-index';

export class MockRoute implements Routes {
  public router = Router();
  public controller = new MockController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use('/:serverId/mock', this.controller.mockApi);
    this.router.get('/:serverId/mocks', this.controller.getMocskApi);
    this.router.use('/mocks', express.static(MOCKS_DIR), serveIndex(MOCKS_DIR, { icons: true }));
    this.router.use('/:serverId/download', this.controller.downloadMocks);
    this.router.put('/mock/reset', this.controller.resetMockRequestsApi);
  }
}
