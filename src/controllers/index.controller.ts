import { NextFunction, Request, Response } from 'express';

class IndexController {
  public index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.status(200).send({status: "OK", message: 'Moq is up and ready to work!!!'});
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
