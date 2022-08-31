import { Request, Response } from 'express';
import fs from 'fs';
import { join } from 'path';
import { render } from '../services/template.service';
import { logger } from '../utils/logger';
import { bodyMatch, getFiles, getHash, mappingsDir, matchPath, randInt } from '../utils/util';

export default class MockService {
  public getMocks(serverId: string) {
    const dir = mappingsDir(serverId);
    const mocks = [];
    getFiles(dir).forEach(file => {
      try {
        const rawdata = fs.readFileSync(file) as any;
        const mock = JSON.parse(rawdata);
        mocks.push(mock);
      } catch (error) {
        throw Error(`Can not read file ${file}`);
      }
    });
    return mocks;
  }

  public findMock = async (req: Request, res: Response) => {
    const serverId = req.params.serverId || 'default';
    const url = req.url;
    const method = req.method;
    const body = req.body;
    const mocksForPath = [];
    const dir = mappingsDir(serverId);

    logger.info('========= About to find a mock ============');
    logger.info(`[${method}] ${url}\n\n${JSON.stringify(body, null, 2)}\n`);

    getFiles(dir).forEach(file => {
      const rawdata = fs.readFileSync(file) as any;
      const mock = JSON.parse(rawdata);
      const urlMatchingResult = matchPath(mock.request.url, url);

      if (body) {
        const isBodyMatch = bodyMatch(body, mock.request.body);
        if (!isBodyMatch) {
          return;
        }
      }

      if (urlMatchingResult && mock.request.method == method) {
        mocksForPath.push({ ...mock, params: urlMatchingResult.params });
      }
    });

    if (mocksForPath.length > 0) {
      const mock = mocksForPath[randInt(0, mocksForPath.length)];
      const statusCode = mock.response.statusCode;

      const params = {
        url: {
          ...mock.params,
        },
        body: {
          ...body,
        },
      };

      const mockResponse = await render(mock.response.body, params);
      this.logMockResponse(mock, method, url, statusCode, mockResponse);
      res.status(mock.response.statusCode).send(mockResponse);
    } else {
      logger.info(`Mock is NOT FOUND for ${method} ${url}`);

      const unmatchedDir = join(dir, '..', 'missing');

      const request = { method, url, body };

      if (!fs.existsSync(unmatchedDir)) {
        fs.mkdirSync(unmatchedDir, { recursive: true });
      }
      const hash = getHash(method, url, body);

      const fileName = `${unmatchedDir}/${hash}.json`;
      fs.writeFileSync(fileName, JSON.stringify(request, null, 2));

      res.status(404).send({
        status: 'Mock not found',
        request,
      });
    }
  };

  private logMockResponse = (mock, method, url, statusCode, mockResponse) => {
    logger.info(`Response for [${method}] ${url} (${statusCode})`);
    logger.info(`======= Mock ${mock.hash} =======\n
${JSON.stringify(mockResponse, null, 2)}\n`);
    logger.info(`======= Mock ${mock.hash} ======`);
  };
}
