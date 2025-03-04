import fs from 'fs';
import { Router } from 'express';
import removeExtension from '../../utils/removeExtension';

const router = Router();
const pathRouter = `${__dirname}`;
const files = fs.readdirSync(pathRouter);
files.map(async (file: string) => {
  const fileWithOutExt:string = removeExtension(file)
  const skip = ['index'].includes(fileWithOutExt)
  if (!skip) {
    router.use(`/${fileWithOutExt}`, (await import(`./${file}`)).default);
  }
});

export default router;
