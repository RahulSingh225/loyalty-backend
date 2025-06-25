import {Router} from 'express';
import { contentController } from '../controllers';

const contentRouter = Router();


contentRouter.get('/:type', (req, res) => contentController.listContents(req, res));
contentRouter.post('/:id', (req, res) => contentController.saveContent(req.params.id, req.body.content));

export default contentRouter;