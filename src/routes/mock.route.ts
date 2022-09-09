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
    this.router.use('/files', express.static(MOCKS_DIR), serveIndex(MOCKS_DIR, { icons: true }));
    this.router.get('/:serverName/download', this.controller.downloadMocks);
    this.router.get('/history', this.controller.showHistory);
  }
}
