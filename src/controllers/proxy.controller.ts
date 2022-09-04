import ProxyService from '../services/proxy.service';
import { NextFunction, Request, Response } from 'express';
import { PORT } from '../config';
import { getHash, getProxyConfig } from '../utils/util';
import MockService from '../services/mock.service';
import { logger } from '../utils/logger';

export default class ProxyController {
  public proxyService = new ProxyService();
  public mockService = new MockService();

  public proxyApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info(`Request [${req.method}] ${req.url}`);
    try {
      const serverId = req.params.serverId;
      const config = await getProxyConfig(serverId);
      const url = req.url;
      const method = req.method;
      const body = req.body;
      const hash = getHash(method, url, body);
      const proxyConfig = config.proxy;
      if (!proxyConfig?.enabled || proxyConfig?.useMockFor?.includes(hash)) {
        res.send(await this.mockService.findMock(req, res));
      } else {
        const middleware = await this.proxyService.proxy(config);
        const result = await middleware(req, res, next);
        return result;
      }
    } catch (error) {
      next(error);
    }
  };

  public createProxyApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serverId = req.body.name;
      const url = req.body.url;
      const result = await this.proxyService.createProxy(serverId, url);
      const proxyUrl = `${req.protocol}://${req.hostname}:${PORT}/${serverId}/moq`;
      res.send({ ...result, proxyUrl });
    } catch (error) {
      next(error);
    }
  };

  public recordingApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serverId = req.params.serverId;
      const status = req.body;
      const result = await this.proxyService.recording(serverId, status);
      res.send(result);
    } catch (error) {
      next(error);
    }
  };

  public getConfigApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serverId = req.params.serverId;
      const config = await getProxyConfig(serverId);
      res.send(config);
    } catch (error) {
      next(error);
    }
  };
}
