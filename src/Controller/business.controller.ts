import { NextFunction, Request, Response } from "express";
import BussinessModel from "../Model/business.model";
import Print from "../Utils/print.utils";

class BusinessController {
    private readonly print:Print = new Print('Bussiness Controller');
    private bussinessModel!:BussinessModel; 
    constructor() {
        this.bussinessModel = new BussinessModel();
    }
    
    private handleResponse(rs:Response, result:any) {
        return rs.status(result.status).json({...result, success: result.status >= 200 && result.status < 400});
    }

    public async createTableIfNotExists() {
        try {
            await this.bussinessModel.init();    
        } 
        catch (error) {
            throw error;
        }
    }

    public createBusiness = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const payload = rq.body;
            const response = await this.bussinessModel.createBusiness({...payload, created_by: rq.user?.id});
            this.handleResponse(rs, response);
        }
        catch(error) {
            next(error)
        }
    }

    public getBusiness = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const response = await this.bussinessModel.getBusiness();
            this.handleResponse(rs,response);
        } 
        catch (error) {
            next(error)
        }
    }

    public getBusinessById = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const { id } = rq.params;
            const response = await this.bussinessModel.getBusiness(id as string);
            this.handleResponse(rs,response);
        } 
        catch (error) {
            next(error)
        }
    }

    public getBusinessByCondition = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const queries = rq.body;
            const response = await this.bussinessModel.getBusinessByCondition({...queries, created_by: rq.user?.id});
            this.handleResponse(rs, response);
        } 
        catch (error) {
            next(error);   
        }
    }

    public searchBusiness = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const { search } = rq.params;
            
            this.print.log(search);

            const response = await this.bussinessModel.searchBusiness((search as string).toLowerCase());
            this.handleResponse(rs, response);
        } 
        catch (error) {
            next(error)    
        }
    }

    public updateBussiness = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const payload = rq.body;
            const { id } = rq.params;

            const response = await this.bussinessModel.updateBusiness((id as string), payload, rq.user?.id);
            this.handleResponse(rs, response);
        } 
        catch (error) {
            next(error);
        }
    }
}

export default BusinessController;