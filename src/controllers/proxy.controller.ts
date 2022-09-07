import ProxyService from '../services/proxy.service';
import { NextFunction, Request, Response } from 'express';
import { getHash, getProxyConfig } from '../utils/util';
import MockService from '../services/mock.service';
import { logger } from '../utils/logger';
import { Body, Controller, Get, Path, Post, Put, Route } from 'tsoa';

@Route()
export class ProxyController extends Controller {
  public proxyService = new ProxyService();
  public mockService = new MockService();

  public proxyApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info(`Request [${req.method}] ${req.url}`);
    try {
      const serverId = req.params.serverId;
      const config = await getProxyConfig(serverId);
      const url = req.url;
      const proxyConfig = config.proxy;
      if (!proxyConfig?.enabled || proxyConfig?.useMockFor?.includes(url)) {
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

  @Post('proxy')
  public async createProxyApi(@Body() body: { name: string; url: string }): Promise<any> {
    const serverName = body.name;
    const url = body.url;
    const result = await this.proxyService.createProxy(serverName, url);
    const proxyPath = `/${serverName}/moq`;
    return { ...result, proxyPath };
  }

  @Put('/{serverName}/config')
  public async recordingApi(
    serverName: string,
    @Body()
    body: {
      serverUrl: string;
      proxy: {
        enabled: boolean;
        omitHeaders: string[];
      };
    },
  ): Promise<any> {
    try {
      const result = await this.proxyService.recording(serverName, body);
      return result;
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('/{serverName}/config')
  public async getConfigApi(serverName: string): Promise<any> {
    try {
      const config = await getProxyConfig(serverName);
      return config;
    } catch (error) {
      return { error: error.message };
    }
  }
}
