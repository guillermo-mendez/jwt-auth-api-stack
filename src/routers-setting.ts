import express, { Request, Response } from 'express';
import routes from './lib/routers';
const app = express();

app.use('/api', [routes]);
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send({message: 'health'})
});


export default app;


