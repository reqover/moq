import { bodyMatch } from '../utils/body.matcher';
import { Request, Response } from 'express';
import fs from 'fs';
import { join } from 'path';
import { render } from '../services/template.service';
import { logger } from '../utils/logger';
import { getFiles, getHash, mappingsDir, matchPath, pathToFolders, randInt } from '../utils/util';
import { _ } from 'lodash';
import importFresh from 'import-fresh';

let mockRequests = {};

export default class MockService {
  public updateMockRequests(data): any {
    mockRequests = { ...mockRequests, ...data };
    return mockRequests;
  }
  
  public resetMockRequests() {
    mockRequests = {}
    return mockRequests;
  }

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

  private countRequest = hash => {
    const value = mockRequests[hash]?.times;
    if (value) {
      mockRequests[hash] = { times: value + 1 };
    } else {
      mockRequests[hash] = { times: 1 };
    }
    return this.getRequestCount(hash);
  };

  private getRequestCount = hash => {
    return mockRequests[hash]?.times || 0;
  };

  public findMock = async (req: Request, res: Response) => {
    const serverId = req.params.serverId || 'default';
    const url = req.url;
    const method = req.method;
    const body = req.body;
    let mocksForPath = [];
    const dir = mappingsDir(serverId);
    const hash = getHash(method, url, body);

    const requestCount = this.countRequest(hash);
    logger.info('========= About to find a mock ============');
    logger.info(`[${method}] ${url}\n\n${JSON.stringify(body, null, 2)}\n
Headers:\n\n${JSON.stringify(req.headers, null, 2)}\n`);
    const folders = pathToFolders(url)
    for (const file of getFiles(join(dir, folders))) {
      // const rawdata = fs.readFileSync(file) as any;
      // const mock = JSON.parse(rawdata);
      const { mapping } = await importFresh(file) as any;
      if (mapping.request.method != method) {
        continue;
      }

      const urlMatchingResult = matchPath(mapping.request.url, url);
      if (!urlMatchingResult) {
        continue;
      }

      if (body) {
        const isBodyMatch = await bodyMatch(serverId, body, mapping.request);
        if (!isBodyMatch) {
          continue;
        }
      }

      mocksForPath.push({ ...mapping, params: urlMatchingResult.params });
    }

    // generate new ites if times is array ex [3, 5]
    mocksForPath = mocksForPath
      .map(item => {
        const result = [];
        const itemData = item.request.times;
        if (Array.isArray(itemData)) {
          for (const n of itemData) {
            const updatedItem = _.merge({}, item, { request: { times: n } });
            result.push(updatedItem);
          }
          return result;
        }
        return item;
      })
      .flat();

    const oddOrOven = requestCount % 2 == 0 ? 'even' : 'odd';
    const groupedMocks = this.groupByTimes(mocksForPath);
    const mocksForRequest = groupedMocks[requestCount] || groupedMocks[oddOrOven] || groupedMocks[0];
    if (mocksForRequest?.length > 0) {
      const mock = _.sample(mocksForRequest);
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
      logger.info(`Mock is NOT FOUND for ${method} ${url}\n\n${JSON.stringify(body, null, 2)}\n`);
      const folders = pathToFolders(req.path);
      const unmatchedDir = join(dir, '..', 'missing', folders);

      const result = JSON.stringify(
        {
          id: hash,
          request: {
            method: method,
            url: url,
            body: {
              equalTo: {
                content: {
                  ...body,
                },
              },
            },
          },
          response: {
            statusCode: null,
            body: null,
          },
        },
        null,
        4,
      );

      if (!fs.existsSync(unmatchedDir)) {
        fs.mkdirSync(unmatchedDir, { recursive: true });
      }

      const fileName = `${unmatchedDir}/${hash}.json`;
      fs.writeFileSync(fileName, result);

      const request = { method, url, body };
      res.status(404).send({
        status: 'Mock not found',
        hash,
        requestCount,
        request,
      });
    }
  };

  private groupByTimes = mocks => {
    const groupData = _.groupBy(mocks, item => {
      return _.get(item, 'request.times', 0);
    });

    return groupData;
  };

  private logMockResponse = (mock, method, url, statusCode, mockResponse) => {
    logger.info(`Response for [${method}] ${url} (${statusCode})`);
    logger.info(`======= Mock ${mock.id} =======\n
${JSON.stringify(mockResponse, null, 2)}\n`);
    logger.info(`======= Mock ${mock.id} ======`);
  };
}
