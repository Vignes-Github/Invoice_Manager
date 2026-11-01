import express from 'express';

import { authMiddleware } from '../middleware/auth.middleware';

import userRouter from './user.routes';
import authRouter from './auth.routes';
import businessRouter from './business.routes';
import clientRouter from './client.routes';

const indexRouter = express.Router();

indexRouter.use('/auth', authRouter);
indexRouter.use('/users', authMiddleware, userRouter);
indexRouter.use('/business', authMiddleware, businessRouter);
indexRouter.use('/client', authMiddleware, clientRouter);

export default indexRouter