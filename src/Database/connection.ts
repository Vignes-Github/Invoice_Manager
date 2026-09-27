import {Pool, PoolClient} from 'pg';
import { config } from 'dotenv';
import Print from '../utils/print.utils';

config();

class PostgresConnection {

    static #instance:PostgresConnection;

    private pool!:Pool;
    private client!:PoolClient;
    private readonly print:Print = new Print('Database');

    private constructor() {
        this.pool = new Pool({
            user: process.env.PG_USERNAME,
            password: process.env.PG_PASSWORD,
            host: process.env.PG_HOST,
            port: Number(process.env.PG_PORT),
            database: process.env.PG_DB_NAME
        })

        this.pool.on('connect', (pool:PoolClient) => {
            this.print.log('Postgres Database Connected..')
        })

        this.pool.on('error', (error:any) => {
            this.print.error('Error Happened while connecting to database \n', error);
        })
    }

    public static get instance() {
        if(!PostgresConnection.#instance) {
            PostgresConnection.#instance = new PostgresConnection();
        }
        return PostgresConnection.#instance;
    }

    public async connectPG() {
        this.client = await this.pool.connect();
    }

    public getClient() {
        return this.client;
    }
}

export default PostgresConnection