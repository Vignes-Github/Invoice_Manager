import express from 'express';
import AuthController from '../Controller/auth.controller';
import UserController from '../Controller/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const authRouter = express.Router();
const controller = new AuthController();
const userController = new UserController();

authRouter.post('/login', controller.login);
authRouter.post('/logout', authMiddleware, controller.logout);
authRouter.post('/register', userController.createUser);

export default authRouter;