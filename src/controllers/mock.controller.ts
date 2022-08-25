import { MOCKS_DIR } from '@/config';
import { render } from '@/services/template.service';
import { Request, Response } from 'express';
import fs from 'fs';
import { match as pathMatcher} from 'path-to-regexp';
import match  from 'match-json';

export class MockController {
  public mockApi = async (req: Request, res: Response): Promise<void> => {
    const serverId = req.params.serverId || 'default';
    const url = req.url;
    const method = req.method;
    const body = req.body;
    let mocksForPath = [];
    
    const dir = `${MOCKS_DIR}/${serverId}`;
    fs.readdirSync(dir).forEach(file => {
      const rawdata = fs.readFileSync(`${dir}/${file}`) as any;
      const mock = JSON.parse(rawdata);
      const urlMatchingResult = this.matchPath(mock.request.url, url);

      if(mock?.request.body) {
        const isBodyMatch = this.bodyMatch(body, mock?.request.body)
        if(!isBodyMatch){
          return
        }
      };

      if (urlMatchingResult && mock.request.method == method) {
        mocksForPath.push({...mock, params: urlMatchingResult.params});
      }
    });

    if (mocksForPath.length > 0) {
      const mock = mocksForPath[this.randInt(0, mocksForPath.length)];
      const statusCode = mock.response.statusCode

      const mockResponse = await render(mock.response.body, mock.params);
      console.log(`Mock response for ${method} ${url} (${statusCode})\n ${JSON.stringify(mockResponse, null, 2)}`);

      res.status(mock.response.statusCode).send(mockResponse);
    } else {
      res.status(404).send({
        status: 'Mock not found',
        method,
        url,
      });
    }
  };

  private matchPath = (pattern, path) => {
    const matchFunction = pathMatcher(pattern.replace('?', '\\?'));
    return matchFunction(path);
  };

  private bodyMatch = (body, pattern) => {
    return match(body, pattern);
  };

  private randInt = (from: number, to: number) => {
    return Math.floor(Math.random() * to) + from
}
}
