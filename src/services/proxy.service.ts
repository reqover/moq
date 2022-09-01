import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { logger } from '../utils/logger';
import qs from 'qs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { PROXY_PATH } from '../config';
import { join } from 'path';
import { getHash, getProxyConfig, isEmpty, mappingsDir, proxyRootDir } from '../utils/util';
import { ClientRequest } from 'http';

export default class ProxyService {
  public createProxy = async (serverId, url) => {
    const data = {
      serverUrl: url,
      proxy: true,
    };

    this.saveConfig(serverId, data);
    return { status: 'created' };
  };

  private saveConfig = async (serverId, data) => {
    const configDir: string = proxyRootDir(serverId);
    const fileName = `config.json`;
    const configFilePath = join(configDir, fileName);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    await fs.writeFileSync(configFilePath, JSON.stringify(data, null, 2));
  };

  public proxy = async config => {
    const serverUrl = config.serverUrl;
    return createProxyMiddleware({
      target: serverUrl,
      secure: false,
      changeOrigin: true,
      selfHandleResponse: true,
      pathRewrite: {
        [`^/(.*?)${PROXY_PATH}`]: '',
      },
      onProxyReq: this.proxyReq(config),
      onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req: any, res) => {
        return this.proxyRes(responseBuffer, proxyRes, req, res);
      }),
      router: () => {
        logger.info(`Router target ${serverUrl}`);
        return serverUrl;
      },
    });
  };

  private proxyReq = (config) => {
    return (proxyReq: ClientRequest, req) => {
      const omitHeaders: string[] = config.proxy.omitHeaders || []
      if(omitHeaders){
        omitHeaders.forEach((header) => {
          proxyReq.removeHeader(header)
        })
      }

      // add custom header to request
      if (!req.body) {
        return;
      }

      const contentType: any = proxyReq.getHeader('Content-Type');
      const writeBody = (bodyData: string) => {
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      };

      if (contentType?.includes('application/json')) {
        writeBody(JSON.stringify(req.body));
      }

      if (contentType?.includes('application/x-www-form-urlencoded')) {
        const body = qs.stringify(req.body)
        writeBody(body);
      }
      // or log the req
    }
  };

  private proxyRes = (responseBuffer, proxyRes, req, res) => {
    const serverId = req.params.serverId || 'default';
    const requestUrl = req.url;
    const requestMethod = req.method;
    const requestBody = req.body;

    const responseStatusCode = res.statusCode;
    let responseBody = {};
    const response = responseBuffer.toString('utf8');
    if (!isEmpty(response) && proxyRes.headers['content-type'].includes('application/json')) {
      responseBody = JSON.parse(response);
    }

    const uuid = uuidv4();
    const hash = getHash(requestMethod, requestUrl, requestBody);
    const result = JSON.stringify(
      {
        id: uuid,
        hash: hash,
        request: {
          method: requestMethod,
          url: requestUrl,
          body: {
            equalTo: {
              ...requestBody,
            },
          },
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

    const folders = this.pathToFolders(req.path);
    const dir = join(mappingsDir(serverId), folders);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const fileName = `${dir}/${hash}.json`;
    fs.writeFileSync(fileName, result);
    logger.info(`Proxy result is saved: ${fileName}`);
    return response;
  };

  private pathToFolders = (path: string) => {
    return join(...path.split('/'));
  };

  public recording = async (serverId, status: any) => {
    const config = await getProxyConfig(serverId);
    const result = { ...config, ...status };
    this.saveConfig(serverId, result);
    return result;
  };
}
