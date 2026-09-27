import { config } from "dotenv";
import express, { Application, Request, Response } from "express";
import Print from "./utils/print.utils";
import PostgresConnection from "./Database/connection";
import indexRouter from "./Routes/index.routes";

config();

const app: Application = express();
const print: Print = new Print();

async function bootstrap() {
    try {
        // Connect to database first
        const dbInstance = PostgresConnection.instance;
        dbInstance.connectPG();

        // Middleware
        app.use(express.json());

        // Routes
        app.use("/", indexRouter);

        // Health check
        app.get("/health", (req: Request, res: Response) => {
            res.status(200).json({
                success: true,
                message: "Server is up and running.."
            });
        });

        // Start server only after DB is ready
        app.listen(process.env.SERVER_PORT, (error?: Error) => {
            if (error) {
                print.error(error);
                return;
            }

            print.cls();

            print.log(
                "Server up and running in PORT => ",
                process.env.SERVER_PORT
            );
        });

    } catch (error) {
        print.error("Application startup failed:", error);
        process.exit(1);
    }
}

bootstrap();
