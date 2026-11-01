import { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user: JwtPayload; // replace `any` with your JWT payload type
        }
    }
}
