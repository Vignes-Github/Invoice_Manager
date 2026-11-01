import { NextFunction, Request, Response } from "express";
import ClientModel from "../Model/client.model";
import Print from "../Utils/print.utils"

class ClientController {
    private readonly print:Print = new Print('Client Controller');
    private clientModel!:ClientModel;

    constructor() {
        this.print.log('Initialized');
        this.clientModel = new ClientModel();
    }

    private handleResponse(rs:Response, result:any) {
        return rs.status(result.status).json({...result, success: result.status >= 200 && result.status < 400});
    }

    public async createTableIfNotExists() {
        try {
            await this.clientModel.init();    
        } 
        catch (error) {
            throw error;
        }
    }

    public createClient = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const payload = rq.body;
            const response = await this.clientModel.createClient({...payload, created_by: rq.user?.id});
            this.handleResponse(rs, response);
        } 
        catch (error) {
            next(error);    
        }
    }

    public getClient = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const { id } = rq.query

            if(!id) {
                this.handleResponse(rs, {status: 400, message: "Insufficient params to operate this action."});
                return;
            }

            const response = await this.clientModel.getClients(id as string);
            this.handleResponse(rs,response);
        } 
        catch (error) {
            next(error)
        }
    }

    public getClientById = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const { client_id } = rq.params;
            const { id } = rq.query;

            if(!id) {
                this.handleResponse(rs, {status: 400, message: "Insufficient params to operate this action."});
                return;
            }

            const response = await this.clientModel.getClients(id as string, client_id as string);
            this.handleResponse(rs,response);
        } 
        catch (error) {
            next(error)
        }
    }

    public getClientByCondition = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const queries = rq.body;
            const { id } = rq.query;

            if(!id) {
                this.handleResponse(rs, {status: 400, message: "Insufficient params to operate this action."});
                return;
            }

            const response = await this.clientModel.getClientsByCondition((id as string), {...queries, created_by: rq.user?.id});
            this.handleResponse(rs, response);
        } 
        catch (error) {
            next(error);   
        }
    }

    public searchClient = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const { search } = rq.params;
            const { id } = rq.query;

            if(!id) {
                this.handleResponse(rs, {status: 400, message: "Insufficient params to operate this action."});
                return;
            }


            const response = await this.clientModel.searchClient((id as string), search as string);
            this.handleResponse(rs, response);
        }
        catch (error) {
            next(error);    
        }
    }

    public updateClient = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const payload = rq.body;
            const { client_id } = rq.params;
            const { id } = rq.query;


            if(!id) {
                this.handleResponse(rs, {status: 400, message: "Insufficient params to operate this action."});
                return;
            }

            const response = await this.clientModel.updateClient((id as string), (client_id as string), payload, rq.user?.id);
            this.handleResponse(rs, response);
        } 
        catch (error) {
            next(error);
        }
    }
    
}

export default ClientController