import { NextFunction, Request, Response } from 'express';
import MockService from '../services/mock.service';
import archiver from 'archiver';
import { getFiles, mappingsDir } from '../utils/util';
import { Body, Controller, Get, Put, Query, Route } from 'tsoa';

@Route()
export class MockController extends Controller {
  public mockService = new MockService();

  public mockApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.send(await this.mockService.findMock(req, res));
    } catch (error) {
      next(error);
    }
  };

  @Put('/mock/requests')
  public async upadateMockRequestsApi(@Body() body: { hash: 1 }): Promise<any> {
    try {
      return await this.mockService.updateMockRequests(body);
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('/mock/requests')
  public async getMockRequestsApi(): Promise<any> {
    try {
      return await this.mockService.getMockRequests();
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('/mock/requests/reset')
  public async resetMockRequestsApi(): Promise<any> {
    try {
      return await this.mockService.resetMockRequests();
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('/mock/missing')
  public getMissingMockRequests(@Query() serverName: string): any {
    try {
      return this.mockService.getMissingMockRequests(serverName);
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('/mock/scenarios/reset')
  public async resetMockScenariosApi(): Promise<any> {
    try {
      return await this.mockService.resetMockScenarios();
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('/mock/history')
  public async getMockRequestsHistory(): Promise<any> {
    try {
      return await this.mockService.getHistory();
    } catch (error) {
      return { error: error.message };
    }
  }

  public async downloadMocks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serverId = req.params.serverName || 'default';
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
        archive.file(files[i], { name: files[i] });
      }

      archive.finalize();
    } catch (error) {
      next(error);
    }
  }
}
