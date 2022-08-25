import { MOCKS_DIR } from '@/config';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

class ProxyController {
  public proxyApi = (req: Request, res: Response, next: NextFunction): void => {
    const serverId = req.params.serverId || 'default';
    const url = req.url;
    const method = req.method;
    const body = req.body;

    const uuid = uuidv4();
    const result = JSON.stringify(
      {
        id: uuid,
        request: {
          method,
          url,
          body
        },
        response: {
          statusCode: 200,
          body: {
            id: 1,
            name: 'Mock',
          },
        },
      },
      null,
      4,
    );

    const dir = `${MOCKS_DIR}/${serverId}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(`${dir}/${uuid}.json`, result);

    res.send('ok');
  };
}

export default ProxyController;
