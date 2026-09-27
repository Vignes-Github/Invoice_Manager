import {PoolClient} from 'pg'
import PostgresConnection from '../Database/connection';
import Print from '../utils/print.utils';
import { IUserRepoCreate } from '../Interface/userRepo.interface';

class UserRepo {
    private dbInstance!:PostgresConnection;
    private client!:PoolClient;

    private readonly print:Print = new Print('User Repo')

    constructor() {
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
     * User Repo
     * Used to create a new user table if not exists in the database
     */
    public async createTableIfNotExists() {
        await this.getClient();
        await this.client.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
                firstName VARCHAR(50) NOT NULL ,
                lastName VARCHAR(50) NOT NULL ,
                username VARCHAR(120) NOT NULL,
                mailId VARCHAR(120) NOT NULL,
                password VARCHAR(100) NOT NULL,
                active BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `).then((res:any) => {
            this.print.log('User Table Created...')
        }).catch((error:any) => {
            this.print.error('Error Happened while created User table', error);
        })
    }

    /**
     * User Repo
     * Used to create new user
     * @param payload : IUserRepoCreate-Interface
     * @returns - User
     */
    public async createNewUser(payload:IUserRepoCreate) {
        await this.getClient();
        try {
            const {firstName, lastName, username, mailId, password} = payload;
            const result = await this.client.query(`
                INSERT INTO users (firstName, lastName, username, mailId, password) 
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, firstName, lastName, username, mailId, created_at, updated_at
            `, 
            [firstName, lastName, username, mailId, password]
            ); 
            
            this.print.log('User Created');
            return result.rows[0];
        } 
        catch (error:any) {
            this.print.error("Error Happenend while creating a new user \n",error);
            return null
        }
    }

    /**
     * User Repo
     * Used to get user details based on the id
     * @param id : string - User ID
     * @returns User
     */
    public async getUserById(id: string) {
        await this.getClient();
        try {
            const result = await this.client.query(`
                SELECT id, firstName, lastName, username, mailId, active, created_at, updated_at 
                FROM users 
                WHERE id = $1
            `, [id]);

            this.print.log(`User with id:${id}, Fetched`);
            return result.rows[0] ?? null;
        } 
        catch (error:any) {
            this.print.error("Error Happenend while fetching user details \n",error);
            return null   
        }
    }

    /**
     * User Repo
     * Used to get user details based on the username
     * @param username : string - Username
     * @returns User
     */
    public async getUserByUsername(username: string) {
        await this.getClient();
        try {
            const result = await this.client.query(`
                SELECT id, firstName, lastName, username, mailId, active, created_at, updated_at 
                FROM users 
                WHERE username = $1
            `, [username]);

            this.print.log(`User with user:${username}, Fetched`);
            return result.rows[0] ?? null
        } 
        catch (error:any) {
            this.print.error("Error Happenend while fetching user details \n",error);
            return null   
        }
    }
}

export default UserRepo