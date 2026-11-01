import Print from "../Utils/print.utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({quiet: true});

class JwtService {
    private readonly print:Print = new Print("JWT Service");
    constructor() {
        this.print.log("JWT Service Used..");
    }

    sign(obj:any): string {
        const jwtToken = jwt.sign(obj, process.env.ENCRYPTION_KEY as string);
        return jwtToken;
    }

    verify(token:any): string | JwtPayload {
        return jwt.verify(token, process.env.ENCRYPTION_KEY as string);
    }
}

export default JwtService