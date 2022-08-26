import { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { logger } from '../utils/logger';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { MOCKS_DIR } from '../config';

export default class ProxyService {
  private filter = (pathname, req) => {
    if (pathname == '/favicon.ico') {
      return false;
    }
    return true;
  };

  private getProxytarget = async (serverId: string) => {
    const configFile = `../../mocks/${serverId}/config.js`;
    const { config } = await import(configFile);

    return config.serverUrl;
  };

  public createProxy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serverId = req.params.serverId;
    const serviceUrl = await this.getProxytarget(serverId);
    const middleware = createProxyMiddleware(this.filter, {
      target: serviceUrl,
      secure: false,
      changeOrigin: true,
      selfHandleResponse: true,
      pathRewrite: {
        ['^/(.*?)/proxy']: '',
      },
      onProxyReq: this.proxyReq,
      onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req: any, res) => {
        return this.proxyRes(responseBuffer, proxyRes, req, res);
      }),
      router: req => {
        logger.info(`Router target ${serviceUrl}`);
        return serviceUrl;
      },
    });
    const result = await middleware(req, res, next);
    return result;
  };

  private proxyReq = (proxyReq, req) => {
    // add custom header to request
    if (!req.body) {
      return;
    }

    const contentType = proxyReq.getHeader('Content-Type');
    const writeBody = (bodyData: string) => {
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    };

    if (contentType === 'application/json') {
      writeBody(JSON.stringify(req.body));
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      writeBody(querystring.stringify(req.body));
    }
    // or log the req
  };

  private proxyRes = (responseBuffer, proxyRes, req, res) => {
    const serverId = req.params.serverId || 'default';
    const requestUrl = req.url;
    const requestMethod = req.method;
    const requestBody = req.body;
    
    const responseStatusCode = res.statusCode;
    let responseBody = null;
    const response = responseBuffer.toString('utf8');
    if (proxyRes.headers['content-type'] === 'application/json') {
      responseBody = JSON.parse(response);
    }

    const uuid = uuidv4();
    const result = JSON.stringify(
      {
        id: uuid,
        request: {
          method: requestMethod,
          url: requestUrl,
          body: requestBody,
        },
        response: {
          statusCode: responseStatusCode,
          body: responseBody,
        },
      },
      (key, value) => {
        if (value !== null) return value;
      },
      4,
    );

    const dir = `${MOCKS_DIR}/${serverId}/mappings`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(`${dir}/${uuid}.json`, result);

    return response;
  };
}
