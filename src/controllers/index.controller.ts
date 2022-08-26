import { NextFunction, Request, Response } from 'express';

class IndexController {
  public index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.sendStatus(200).send('Moq is up and ready to work!!!');
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
