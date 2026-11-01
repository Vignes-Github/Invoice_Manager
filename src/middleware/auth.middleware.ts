import { NextFunction, Request, Response } from "express";
import JwtService from "../Services/jwt.service";
import { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({quiet: true});

const jwtService = new JwtService();
const COOKIE_NAME = process.env.COOKIE_NAME as string;

export const authMiddleware = (rq: Request, rs: Response, next: NextFunction) => {
    const token = rq.cookies?.[COOKIE_NAME] ?? rq.query?.token;
    if (!token) {
        return rs.status(401).json({ success: false, status: 401, message: "Not authenticated." });
    }
    try {
        rq.user = jwtService.verify(token) as JwtPayload; // throws if invalid or expired
        next();
    } catch (error) {
        return rs.status(401).json({ success: false, status: 401, message: "Invalid or expired token.", error });
    }
};