import { bodyMatch } from '../utils/body.matcher';
import { Request, Response } from 'express';
import fs from 'fs';
import { join } from 'path';
import { render } from '../services/template.service';
import { logger } from '../utils/logger';
import { getFiles, getHash, mappingsDir, matchPath, pathToFolders } from '../utils/util';
import { _ } from 'lodash';
import importFresh from 'import-fresh';
import { MOCKS_DIR } from '../config';

let mockRequests = {};
const scenarios = {};
const requestHistory = [];

export default class MockService {
  public getMissingMockRequests(serverName: any): any {
    const dir = join(MOCKS_DIR, serverName, 'missing');
    const files = getFiles(dir, '.json');
    const result = [];
    for (const file of files) {
      const raw = fs.readFileSync(file, 'utf-8');
      const missing = JSON.parse(raw);
      result.push(missing);
    }
    return result;
  }

  public resetMockScenarios(): any {
    logger.info('About to reset mock scenarios');
    for (const prop of Object.getOwnPropertyNames(scenarios)) {
      delete scenarios[prop];
    }
    return scenarios;
  }

  public getMockRequests(): any {
    return mockRequests;
  }

  public updateMockRequests(data): any {
    mockRequests = { ...mockRequests, ...data };
    return mockRequests;
  }

  public resetMockRequests() {
    logger.info('About to reset mock requests');
    mockRequests = {};
    return mockRequests;
  }

  public getHistory() {
    return requestHistory;
  }

  public async getMocks(serverId: string) {
    const dir = mappingsDir(serverId);
    const mocks = [];
    const files = getFiles(dir);
    for (const file of files) {
      try {
        const { mapping } = (await importFresh(file)) as any;
        const mock = JSON.stringify(mapping, null, 2);
        mocks.push(mock);
      } catch (error) {
        throw Error(`Can not read file ${file}`);
      }
    }
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
    const serverId = req.params.serverId || '';
    const url = req.url;
    const method = req.method;
    const body = req.body;
    let mocksForPath = [];
    const dir = mappingsDir(serverId);
    const hash = getHash(method, url, body);

    const requestCount = this.countRequest(hash);
    logger.info('========= About to find a mock ============');
    logger.info(`[${method}] ${url}\n\n${JSON.stringify(body, null, 2)}\n`);
    const folders = pathToFolders(url);
    const files =  getFiles(join(dir, folders))
    for (const file of files) {
      const { mapping } = (await importFresh(file)) as any;
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
      const scenario = mapping.scenario;
      const requiredState = scenario?.requiredState;
      if (requiredState) {
        const scenarioState = scenarios[scenario.name]?.state;
        if (scenarioState !== requiredState) {
          logger.info(`Mock required state <${requiredState}> but was <${scenarioState}>`);
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

      const scenario = mock.scenario;
      if (scenario?.setState) {
        scenarios[scenario.name] = { state: scenario.setState };
      }

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
      this.addToHistory({method, url, body}, {statusCode, body: mockResponse });
      res.status(mock.response.statusCode).send(mockResponse);
    } else {
      this.addToHistory({method, url, body}, null);
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

  private addToHistory = (request, response) => {
    requestHistory.unshift({
      request,
      response
    })
  }

  private groupByTimes = mocks => {
    const groupData = _.groupBy(mocks, item => {
      return _.get(item, 'request.times', 0);
    });

    return groupData;
  };

  private logMockResponse = (mock, method, url, statusCode, mockResponse) => {
    logger.info(`Mock response for [${method}] ${url} (${statusCode})`);
    const scenario = mock.scenario;
    if (scenario) {
      logger.info(`======= Scenario =======\n
Required:\n${JSON.stringify(scenario, null, 2)}\n
Actual:\n${JSON.stringify(scenarios[scenario.name], null, 2)}\n
`);
    }
    logger.info(`======= Mock ${mock.id} =======\n
${JSON.stringify(mockResponse, null, 2)}\n`);
    logger.info(`======= Mock ${mock.id} ======`);
  };
}
