import ProxyService from '../services/proxy.service';
import { NextFunction, Request, Response } from 'express';
import { PORT } from '../config';

export default class ProxyController {
  public proxyService = new ProxyService();

  public proxyApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.proxyService.proxy(req, res, next);
      return result;
    } catch (error) {
      next(error);
    }
  };

  public createProxy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serverId = req.body.name;
      const url = req.body.url;
      const result = await this.proxyService.createProxy(serverId, url);

      const proxyUrl = `${req.protocol}://${req.hostname}:${PORT}/${serverId}${req.path}`;

      res.send({ ...result, proxyUrl });
    } catch (error) {
      next(error);
    }
  };
}
