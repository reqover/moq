import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import { ProxyController } from '../controllers/proxy.controller';
import { unless } from '../utils/util';
import { ADMIN_PATH } from '../config';

export class ProxyRoute implements Routes {
  public router = Router();
  public controller = new ProxyController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(unless(`/__admin/*`, this.controller.proxyApi));
    // this.router.use(`/moq/:serverId/`, this.controller.proxyApi);
  }
}
