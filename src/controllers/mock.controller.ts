import { NextFunction, Request, Response } from 'express';
import MockService from '../services/mock.service';
import archiver from 'archiver';
import { getFiles, mappingsDir } from '../utils/util';
import { Body, Controller, Delete, Get, Put, Query, Route } from 'tsoa';

@Route('moq')
export class MockController extends Controller {
  
  public mockService = new MockService();

  public showHistory = async (req: Request, res: Response): Promise<void> => {   
    res.render('history', { history: this.mockService.getHistory() });
  };

  public mockApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.send(await this.mockService.findMock(req, res));
    } catch (error) {
      next(error);
    }
  };

  @Put('requests')
  public async upadateMockRequestsApi(@Body() body: { hash: 1 }): Promise<any> {
    try {
      return await this.mockService.updateMockRequests(body);
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('requests')
  public async getMockRequestsApi(): Promise<any> {
    try {
      return await this.mockService.getMockRequests();
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('requests/reset')
  public async resetMockRequestsApi(): Promise<any> {
    try {
      return await this.mockService.resetMockRequests();
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('missing')
  public getMissingMockRequests(@Query() serverName: string): any {
    try {
      return this.mockService.getMissingMockRequests(serverName);
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('scenarios/reset')
  public async resetMockScenariosApi(): Promise<any> {
    try {
      return await this.mockService.resetMockScenarios();
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('history')
  public async getMockRequestsHistory(): Promise<any> {
    try {
      return await this.mockService.getHistory();
    } catch (error) {
      return { error: error.message };
    }
  }

  @Delete('history')
  public async deleteRequestsHistory(): Promise<any> {
    try {
      return await this.mockService.clearHistory();
    } catch (error) {
      return { error: error.message };
    }
  }

  public async downloadMocks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serverName = req.query.serverName || '';
      const zipName = `${serverName}_files`
      const archive = archiver('zip');

      archive.on('error', function (err) {
        res.status(500).send({ error: err.message });
      });

      //on stream closed we can end the request
      archive.on('end', function () {
        console.log('Archive wrote %d bytes', archive.pointer());
      });

      //set the archive name
      res.attachment(`${zipName}.zip`);

      //this is the streaming magic
      archive.pipe(res);

      const dir = mappingsDir(serverName);

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
