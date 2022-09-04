import { NextFunction, Request, Response } from 'express';
import MockService from '../services/mock.service';
import archiver from 'archiver';
import { getFiles, mappingsDir } from '../utils/util';
import path from 'path';
import { Controller, Get, Route } from 'tsoa';

@Route('mocks')
export class MockController extends Controller {
  public mockService = new MockService();

  @Get('')
  public mockApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.send(await this.mockService.findMock(req, res));
    } catch (error) {
      next(error);
    }
  };

  public resetMockRequestsApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = req.body;
    try {
      res.send(await this.mockService.resetMockRequests(data));
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

  public downloadMocks(req: Request, res: Response, next: NextFunction) {
    try {
      const serverId = req.params.serverId || 'default';
      const archive = archiver('zip');

      archive.on('error', function (err) {
        res.status(500).send({ error: err.message });
      });

      //on stream closed we can end the request
      archive.on('end', function () {
        console.log('Archive wrote %d bytes', archive.pointer());
      });

      //set the archive name
      res.attachment(`${serverId}.zip`);

      //this is the streaming magic
      archive.pipe(res);

      const dir = mappingsDir(serverId);

      const files = getFiles(dir);

      for (const i in files) {
        archive.file(files[i], { name: path.basename(files[i]) });
      }

      archive.finalize();
    } catch (error) {
      next(error);
    }
  }
}
