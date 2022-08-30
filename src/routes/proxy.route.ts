import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import ProxyController from '../controllers/proxy.controller';
import { PROXY_PATH } from '../config';

export class ProxyRoute implements Routes {
  public router = Router();
  public controller = new ProxyController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(`/:serverId${PROXY_PATH}`, this.controller.proxyApi);
    this.router.post(`/proxy`, this.controller.createProxyApi);
    this.router.post(`/:serverId/config`, this.controller.recordingApi);
    this.router.get(`/:serverId/config`, this.controller.getConfigApi);
  }
}
