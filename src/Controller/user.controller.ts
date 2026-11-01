import { NextFunction, Request, Response } from "express";
import Print from "../Utils/print.utils";
import UserModel from "../Model/user.model";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { IUser } from "../Interface/user.interface";

dotenv.config({quiet: true});

class UserController {
    private userModel!:UserModel;
    private readonly print:Print = new Print('User Controller');    
    constructor() {
        this.userModel = new UserModel();
    }

    private handleResponse(rs:Response, result:any) {
        return rs.status(result.status).json({...result, success: result.status >= 200 && result.status < 400});
    }

    public async createTableIfNotExists(){ 
        try {
            await this.userModel.init()
        } 
        catch (error) {
            throw error;    
        }
    }

    public createUser = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const {firstname, lastname, username, mailId, password, confirmPassword} = rq.body;
            if(password !== confirmPassword) {
                this.handleResponse(rs, {status: 406, message: "Password didn't match."})
                return;
            }

            const encryptedPassword = await bcrypt.hash(password, process.env.PASSWORD_ENCRYPTION_KEY  as string);

            const payload:IUser = {
                firstname: (firstname as string).toLowerCase(),
                lastname: (lastname as string).toLowerCase(),
                username: (username as string).toLowerCase(),
                password: encryptedPassword as string,
                mail_id: (mailId as string).toLowerCase()
            }

            const response = await this.userModel.createUser(payload);
            this.handleResponse(rs, response);
        } 
        catch (error:any) {
            next(error)
        }
    }

    public getUser = async(rq:Request, rs:Response, next: NextFunction) => {
        try {
            const response = await this.userModel.getUser();
            this.handleResponse(rs, response);
        } 
        catch (error) {
            next(error);    
        }
    }

    public getUserByCondition = async(rq:Request, rs:Response, next:NextFunction) => {
        try {
            const condition = rq.query
            const response = await this.userModel.getUserByCondition(condition);
            this.handleResponse(rs, response);
        }
        catch(error) {
            next(error);
        }
    }

}

export default UserController