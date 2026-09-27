import express from 'express';
import UserController from '../Controller/user.controller';

const userRouter = express.Router();
const controller = new UserController();
controller.init();

// Routes
userRouter.post('/', controller.createUser);


export default userRouter