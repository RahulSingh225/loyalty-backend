
import { Router } from 'express';
import { userController } from '../controllers';
import { authMiddleware } from '../middleware/auth.middleware';


const  userRouter = Router();
userRouter.get('/list',authMiddleware.verifyJWT, userController.list.bind(userController));
userRouter.get('/profile/:id', authMiddleware.verifyJWT, userController.getUserById.bind(userController));

export default userRouter;
