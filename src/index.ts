import { config } from "dotenv";
import express, { Application, Request, Response } from "express";
import Print from "./utils/print.utils";
import PostgresConnection from "./Database/connection";
config();

const app:Application = express();
const print:Print = new Print();
const dbInstance:PostgresConnection = PostgresConnection.instance;

app.use(express.json());

app.get('/health', (req:Request, res:Response) => {
    res.status(200).json({success: true, message: "Server is up and running.."})
})

app.listen(process.env.SERVER_PORT, (error:any) => {
    if(error) {
        print.error(error);
    }
    else {
        print.cls();
        print.log('Server up and running in PORT => ', process.env.SERVER_PORT);
        dbInstance.connectPG();
    }

})