import { NextFunction, Request, Response } from 'express';
import MockService from '../services/mock.service';

export class MockController {
  public mockService = new MockService();

  public mockApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.send(await this.mockService.findMock(req, res));
    } catch (error) {
      next(error);
    }
  };

  public getMocskApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serverId = req.params.serverId || 'default';
      const mocks = this.mockService.getMocks(serverId);
      res.send(mocks);
    } catch (error) {
      next(error);
    }
  };
}
