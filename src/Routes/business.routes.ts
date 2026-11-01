import express from 'express';
import BusinessController from '../Controller/business.controller';

const businessRouter = express.Router();
const controller = new BusinessController();

controller.createTableIfNotExists();

// Routes
businessRouter.post('/', controller.createBusiness);

businessRouter.put('/condition', controller.getBusinessByCondition);
businessRouter.put('/:id', controller.updateBussiness);

businessRouter.get('/', controller.getBusiness);
businessRouter.get('/:id', controller.getBusinessById);
businessRouter.get('/search/:search', controller.searchBusiness);

export default businessRouter;