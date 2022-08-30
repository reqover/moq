import { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { logger } from '../utils/logger';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { MOCKS_DIR } from '../config';
import { join } from 'path';
import { mappingsDir } from '../utils/util';
import md5 from 'md5';

export default class ProxyService {
  public createProxy = async (serverId, url) => {
    const configDir: string = join('/tmp', 'mocks', serverId);
    const fileName = `config.json`;
    const configFilePath = join(configDir, fileName);

    const data = {
      serverUrl: url
    };

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    await fs.writeFileSync(configFilePath, JSON.stringify(data));
    return { status: 'created' };
  };

  private filter = (pathname, req) => {
    if (pathname == '/favicon.ico') {
      return false;
    }
    return true;
  };

  private getProxytarget = async (serverId: string) => {
    const file = `${MOCKS_DIR}/${serverId}/config.json`;
    try {
      const content = fs.readFileSync(file, 'utf8');
      const config = JSON.parse(content);
      return config.serverUrl;
    } catch (error) {
      throw Error(`Can not load config file ${file}`);
    }
  };

  public proxy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const hash = this.getHash(requestMethod, requestUrl, requestBody);
    const result = JSON.stringify(
      {
        id: uuid,
        hash: hash,
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

    const dir = mappingsDir(serverId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const fileName = `${dir}/${hash}.json`;
    fs.writeFileSync(fileName, result);
    logger.info(`Proxy result is saved: ${fileName}`);
    return response;
  };

  private getHash = (method, url, body) => {
    const data = `${method}#${url}#${JSON.stringify(body)}`
    const hash =  md5(data);
    return hash;
  }
}
