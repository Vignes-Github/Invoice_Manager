import express from 'express';
import UserController from '../Controller/user.controller';

const userRouter = express.Router();
const controller = new UserController();

controller.createTableIfNotExists();

// Routes

userRouter.get('/', controller.getUser);
userRouter.get('/condition', controller.getUserByCondition);


export default userRouter