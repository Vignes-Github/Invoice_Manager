import { NextFunction, Request, Response } from "express";
import UserRepo from "../Repo/user.repo";
import Print from "../utils/print.utils";
import { IUserRepoCreate } from "../Interface/userRepo.interface";

class UserController {
    private userRepo!:UserRepo;
    private readonly print:Print = new Print('User Controller');    
    constructor() {
        this.userRepo = new UserRepo();
    }

    // Call this function in the routes file
    public async init() {
        await this.userRepo.createTableIfNotExists()
    }

    public createUser = async(req:Request, res:Response, next:NextFunction) => {
        try {
            const {firstName, lastName, mailId, password, confirmPassword} = req.body;
            if(password !== confirmPassword) {
                return res.status(406).json({success: false, message: "Password didn't match"});
            }

            // Create More Comparisions
            // Same Mail ID exists
            // User name edit if same user name found in database

            const userName = firstName + '.' + lastName;

            const payload:IUserRepoCreate = {
                firstName,
                lastName,
                username: userName,
                password,
                mailId
            }

            const result = await this.userRepo.createNewUser(payload);
            return res.status(201).json({success: true, message: 'User Created Successfully', user: result})
        } 
        catch (error:any) {
            
        }
    }
}

export default UserController