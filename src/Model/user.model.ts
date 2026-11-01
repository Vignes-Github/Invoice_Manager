import PostgresConnection from "../Database/connection";
import { IUser } from "../Interface/user.interface";
import Print from "../Utils/print.utils";
import {PoolClient} from 'pg'

class UserModel {
    private readonly print:Print = new Print("User Model");

    // Database
    private dbInstance!:PostgresConnection;
    private client!:PoolClient;

    private readonly DATABASE_NAME:string = "users";

    constructor() {
        this.print.log('User Model is used in this service');
        this.dbInstance = PostgresConnection.instance;
    }

    private async getClient() {
        if(this.client) {
            return this.client
        }

        this.client = await this.dbInstance.getClient();
        return this.client
    }

    /**
     * User Model - 
     * Used to create a new user table if not exists in the database
     */
    public async init() {
        await this.getClient();

        if(!this.client){
            this.print.error('Client not created, ABORTING');
            throw new Error('No Client is created to proceed with this operation.')
        }

        await this.client.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
            CREATE TABLE IF NOT EXISTS ${this.DATABASE_NAME} (
                id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
                firstname VARCHAR(50) NOT NULL ,
                lastname VARCHAR(50) NOT NULL ,
                username VARCHAR(120) UNIQUE NOT NULL,
                mail_id VARCHAR(120) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                active BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `)

        this.print.log('Table Created Successfully.');
    }

    /**
     * User Model - 
     * Used to create new user
     * @param payload : IUserRepoCreate-Interface
     * @returns - User
     */
    public async createUser(payload:IUser) {
        await this.getClient();

        if (!this.client) {
            this.print.error('Client not created, ABORTING');
            throw new Error('No Client is created to proceed with this operation.');
        }

        try {
            const {firstname, lastname, username, mail_id, password} = payload;
            
            const result = await this.client.query(`
                INSERT INTO ${this.DATABASE_NAME} (firstName, lastName, username, mail_id, password) 
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, firstname, lastname, username, mail_id, created_at, updated_at
            `, 
            [firstname, lastname, username, mail_id, password]
            ); 
            
            this.print.log('User Created');
            return {status: 201, message: "User created successfully.", data: result.rows[0]}
        } 
        catch (error:any) {
            if (error.code === "23505") {
                let message = "A user with these details already exists.";

                if (error.constraint === "users_username_key") {
                    message = "Username already exists.";
                } 
                else if (error.constraint === "users_mailid_key") {
                    message = "Email already exists.";
                }

                return {
                    status: 409,
                    message,
                    data: null
                };
            }
            this.print.error("Error Happenend while creating user \n",error);
            return {status: 500, message: "Error Happenend while creating user", data: null}
        }
    }

    /**
     * User Model - 
     * Used to fetch all the user data.
     * @returns : users
     */
    public async getUser() {
        await this.getClient();

        if (!this.client) {
            this.print.error('Client not created, ABORTING');
            throw new Error('No Client is created to proceed with this operation.');
        }

        try {
            const query = `SELECT id, firstName, lastName, username, mail_id, active, created_at, updated_at FROM ${this.DATABASE_NAME};`;
            const result = await this.client.query(query);
            this.print.log("User fetched successfully");
            return {status: 200, message: "Users fetched successfully.", data: result.rows, size: result.rowCount ?? 0};
        } catch (error) {
            this.print.error("Error Happenend while fetching users \n",error);
            return {status: 500, message: "Error Happenend while fetching users", data: null}
        }
    }

    /**
     * User Model - 
     * Used to get user details based on condition
     * @param condition: Record<string, any>
     * @returns User
     */
    public async getUserByCondition(condition:Record<string, any>) {
        await this.getClient();

        if (!this.client) {
            this.print.error('Client not created, ABORTING');
            throw new Error('No Client is created to proceed with this operation.');
        }

        try {

            if(Object.keys(condition).length !== 1) {
                return { status: 400, message: "Please provide exactly one search condition.", data: null}
            }

            const [ key, value ] = Object.entries(condition)[0];

            const result = await this.client.query(`
                SELECT id, firstName, lastName, username, mail_id, active, created_at, updated_at 
                FROM ${this.DATABASE_NAME} 
                WHERE ${key} = $1
            `, [value.toLowerCase()]);

            this.print.log(`User fetched successfully.`);
            return {status: 200, message: "User fetched successfully.", data: result.rows ?? null, size: result.rowCount ?? 0};
        }
        catch (error:any) {
            this.print.error("Error Happenend while fetching user \n",error);
            return {status: 500, message: "Error Happenend while fetching user", data: null}
        }
    }

    /**
     * Used to update data for an user with ID.
     * @param id : user Id
     * @param condition : update value
     */
    public async updateUser(id:string, condition:Record<string, any>) {
        await this.getClient();

        if (!this.client) {
            this.print.error('Client not created, ABORTING');
            throw new Error('No Client is created to proceed with this operation.');
        }

        try {
            if(Object.keys(condition).length !== 1) {
                return { status: 400, message: "Please provide exactly one search condition.", data: null}
            }

            const [ key, value ] = Object.entries(condition)[0];


            const result = await this.client.query(
                `UPDATE ${this.DATABASE_NAME} SET ${key} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
                RETURNING id, firstname, lastname, username, mail_id, created_at, updated_at`,
                [value, id]
            );

            this.print.log('User updated successfully.');
            return {status: 200, message: "User updated successfully.", data: result.rows, size: result.rowCount ?? 0};
        }
        catch(error:any) {
            this.print.error("Error Happenend while fetching user \n",error);
            return {status: 500, message: "Error Happenend while fetching user", data: null} 
        }
    }

        /**
     * User Model - 
     * Used to get user details based on condition
     * @param condition: Record<string, any>
     * @returns User
     */
    public async getUserForAuthentication(condition:Record<string, any>) {
        await this.getClient();

        if (!this.client) {
            this.print.error('Client not created, ABORTING');
            throw new Error('No Client is created to proceed with this operation.');
        }

        try {

            if(Object.keys(condition).length !== 1) {
                return { status: 400, message: "Please provide exactly one search condition.", data: null}
            }

            const [ key, value ] = Object.entries(condition)[0];

            const result = await this.client.query(`
                SELECT id, firstName, lastName, username, mail_id, active, created_at, updated_at, password
                FROM ${this.DATABASE_NAME} 
                WHERE ${key} = $1
            `, [value.toLowerCase()]);

            this.print.log(`User fetched successfully.`);
            return {status: 200, message: "User fetched successfully.", data: result.rows ?? null}
        }
        catch (error:any) {
            this.print.error("Error Happenend while fetching user \n",error);
            return {status: 500, message: "Error Happenend while fetching user", data: null}
        }
    }
}

export default UserModel;