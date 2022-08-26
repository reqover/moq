import { MOCKS_DIR } from '../config';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';

import MockService from '@/services/mock.service';
import { nextDay } from 'date-fns';

export class MockController {
  public mockService = new MockService();

  public mockApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.send(await this.mockService.findMock(req, res));
    } catch (error) {
      next(error);
    }
  };

  public getMocskApi = async (req: Request, res: Response): Promise<void> => {
    const serverId = req.params.serverId || 'default';
    const dir = `${MOCKS_DIR}/${serverId}`;
    const mocks = [];
    fs.readdirSync(dir).forEach(file => {
      const rawdata = fs.readFileSync(`${dir}/${file}`) as any;
      const mock = JSON.parse(rawdata);
      mocks.push(mock);
    });

    res.send(mocks);
  };
}
