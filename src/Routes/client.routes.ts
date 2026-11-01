import express from 'express';
import ClientController from '../Controller/client.controller';

const clientRouter = express.Router();
const controller = new ClientController();

controller.createTableIfNotExists();

// Routes
clientRouter.post('/', controller.createClient);

clientRouter.put('/condition', controller.getClientByCondition);
clientRouter.put('/:client_id', controller.updateClient);

clientRouter.get('/', controller.getClient);
clientRouter.get('/:client_id', controller.getClientById);
clientRouter.get('/search/:search', controller.searchClient);

export default clientRouter;