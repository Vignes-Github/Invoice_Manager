import { NextFunction, Request, Response } from "express";
import Print from "../Utils/print.utils";
import UserModel from "../Model/user.model";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import JwtService from "../Services/jwt.service";

dotenv.config({quiet: true});

class AuthController {
    private readonly print:Print = new Print('Auth Controller');
    private readonly userModel!:UserModel;
    private readonly jwtService!:JwtService;

    private readonly COOKIE_NAME = "_cookie";

    constructor() {
        this.userModel = new UserModel();
        this.jwtService = new JwtService();
        this.print.log('Auth Controller Initialized');
    }

    private handleResponse(rs:Response, result:any) {
        return rs.status(result.status).json({...result, success: result.status >= 200 && result.status < 400});
    }

    private get cookieOptions() {
        return {
            httpOnly: true,
            secure: true,
            sameSite: "strict" as const,
            path: "/"
        };
    }

    public login = async(rq:Request, rs:Response, next:NextFunction) => {
        let id:string = "";
        try {
            const { username, password } = rq.body;

            if(!username || !password) {
                this.handleResponse(rs, {status: 400, message: "Username and Password is requried for logging in."});
                return
            }

            const findUser = await this.userModel.getUserForAuthentication({mail_id: username});

            if(!findUser.data || findUser.data.length === 0) {
                this.handleResponse(rs, {status: 401, message: "Invalid mail address."});
                return
            }

            const user = findUser.data[0];

            id = user.id;

            const validPassword = await bcrypt.compare(password, user.password);

            if(!validPassword) {
                this.handleResponse(rs, {status: 401, message: "Invalid Username or Password."});
                return
            }

            if (rq.cookies?.["_cookie"]) {
                this.handleResponse(rs, {status: 403, message: "User already logged in. Please log out that session to continue."});
                return;
            }


            // delete user.password;
            
            delete user.password;
            const cookie = this.jwtService.sign(user);
            rs.cookie(this.COOKIE_NAME, cookie, this.cookieOptions);
            this.handleResponse(rs, {status: 200, message: `${user.firstname} logged in successfully`, data: user});

        }
        catch(error) {
            next(error)
        }
        finally {
            if(id) {
                await this.userModel.updateUser(id, {active: true});
            }
        }
    }

    public logout = async(rq: Request, rs:Response, next:NextFunction) => {
        const id = rq.query?.id ?? rq.user.id;

        if(!id) {
            this.handleResponse(rs, {status: 400, message: "Insufficient Data to process, logout failed."});
        }

        try {
            rs.cookie(this.COOKIE_NAME, "", {...this.cookieOptions, maxAge: 0})
            this.handleResponse(rs, {status: 200, message: "Logged out successfully."});
        } 
        catch (error) {
            next(error);    
        }
        finally {
            if(id) {
                await this.userModel.updateUser(id as string, {active: false});
            }
        }
    }
}

export default AuthController;