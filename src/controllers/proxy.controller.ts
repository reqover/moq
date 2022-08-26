import ProxyService from '../services/proxy.service';
import { NextFunction, Request, Response } from 'express';

export default class ProxyController {
  public proxyService = new ProxyService();

  public proxyApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.proxyService.createProxy(req, res, next);
      return result;
    } catch (error) {
      next(error);
    }
  };
}
