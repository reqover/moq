import express, { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import { MockController } from '../controllers/mock.controller';
import { ADMIN_PATH, MOCKS_DIR } from '../config';
import serveIndex from 'serve-index';

export class MockRoute implements Routes {
  public router = Router();
  public controller = new MockController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(`/__admin/files`, express.static(MOCKS_DIR), serveIndex(MOCKS_DIR, { icons: true }));
    this.router.get(`/__admin/download`, this.controller.downloadMocks);
    this.router.get(`/__admin`, this.controller.showHistory);
  }
}
