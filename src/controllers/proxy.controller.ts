import ProxyService from '../services/proxy.service';
import { NextFunction, Request, Response } from 'express';
import { getProxyConfig } from '../utils/util';
import MockService from '../services/mock.service';
import { logger } from '../utils/logger';
import { Body, Controller, Get, Post, Put, Query, Route } from 'tsoa';

@Route('__admin')
export class ProxyController extends Controller {
  public proxyService = new ProxyService();
  public mockService = new MockService();

  public proxyApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info(`Request [${req.method}] ${req.url}`);
    try {
      const serverId = req.params.serverId || '';
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
    const proxyPath = `/moq/${serverName}/proxy`;
    return { ...result, proxyPath };
  }

  @Put('config')
  public async recordingApi(
    @Query() serverName: string = '',
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

  @Get('config')
  public async getConfigApi(@Query() serverName: string = ''): Promise<any> {
    try {
      const config = await getProxyConfig(serverName);
      return config;
    } catch (error) {
      return { error: error.message };
    }
  }
}
