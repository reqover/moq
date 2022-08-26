import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import ProxyController from '../controllers/proxy.controller';

export class ProxyRoute implements Routes {
  public router = Router();
  public controller = new ProxyController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(`/:serverId/proxy`, this.controller.proxyApi);
    this.router.post(`/proxy`, this.controller.createProxy);
  }
}
