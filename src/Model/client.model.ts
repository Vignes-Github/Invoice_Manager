import { PoolClient } from "pg";
import PostgresConnection from "../Database/connection";
import Print from "../Utils/print.utils";
import { IClient } from "../Interface/client.interface";

import dotenv from "dotenv";

class ClientModel {
    private readonly print:Print = new Print("Client Model");

    // Database
    private dbInstance!:PostgresConnection;
    private client!:PoolClient;

    private readonly DATABASE_NAME:string = "clients";

    // returned columns, aliased to camelCase to match IClient
    private readonly CLIENT_COLUMNS = `
        id, name, business_id, address, pincode,
        gst_in, ph_no, mail_id,
        created_by,
        created_at, updated_at
    `;

    // camelCase field -> db column (whitelist for updates)
    private readonly CLIENT_UPDATABLE: Record<string, string> = {
        name: "name",
        address: "address",
        pincode: "pincode",
        gst_in: "gst_in",
        ph_no: "ph_no",
        mail_id: "mail_id",
    };

    private readonly CLIENT_JSON_FIELDS = ["address", "ph_no"];

    // fields allowed in getClientsByCondition (scalar columns only)
    private readonly CLIENT_SEARCHABLE: Record<string, string> = {
        id: "id",
        name: "name",
        business_id: "business_id",
        pincode: "pincode",
        gst_in: "gst_in",
        mail_id: "mail_id",
        created_by: "created_by",
    };

    private readonly ORDER_BY:string = process.env.GET_ORDER_BY as string ?? "ASC";

    constructor() {
        this.print.log('Client Model is used in this service');
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
     * Client Model - 
     * Used to create a Client table if not exists in the database
     */
    public async init() {
        await this.getClient();

        if (!this.client) {
            this.print.error('Client not created, ABORTING');
            throw new Error('No Client is created to proceed with this operation.');
        }

        await this.client.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;

            CREATE TABLE IF NOT EXISTS ${this.DATABASE_NAME} (
                id            UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
                name          VARCHAR(120) NOT NULL,
                business_id   UUID NOT NULL,
                address       JSONB NOT NULL DEFAULT '[]',
                pincode       VARCHAR(10) NOT NULL,
                gst_in        VARCHAR(15) NOT NULL UNIQUE,
                ph_no         JSONB NOT NULL DEFAULT '[]',
                mail_id       VARCHAR(120) NOT NULL UNIQUE,
                created_by    UUID NOT NULL,
                updated_by    UUID NOT NULL,
                created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients (created_by);
        `);

        this.print.log('Table Created Successfully.');
    }

    // turns a database error into the response we send back
    private alterClientError(error: any, action: string) {
        this.print.error(`Error Happenend while ${action} client \n`, error);
        if (error.code === "23505") {
            const messages: Record<string, string> = {
                clients_name_key: "A client with this name already exists.",
                clients_gst_in_key: "A client with this GSTIN already exists.",
                clients_mail_id_key: "A client with this mail id already exists.",
            };
            return { status: 409, message: messages[error.constraint] ?? "Client already exists.", data: null };
        }
        if (error.code === "22P02") {
            return { status: 400, message: "Invalid id.", data: null };
        }
        if (error.code === "22001") {
            return { status: 400, message: "One of the values is too long (check name, pincode, GSTIN, mail id).", data: null };
        }
        if (error.code === "23503") {
            return { status: 400, message: "Bussiness not found for this client.", data: null };
        }
        return { status: 500, message: `Error Happenend while ${action} client`, data: null };
    }


    /**
     * Client Model - 
     * Used to create client for a bussiness
     * @param payload : IClient
     * @returns response
     */
    public async createClient(payload: IClient) {
        await this.getClient();
        try {
            const { name, business_id, address, pincode, gst_in, ph_no, mail_id, created_by } = payload;

            const result = await this.client.query(
                `INSERT INTO ${this.DATABASE_NAME}
                    (name, business_id, address, pincode, gst_in, ph_no, mail_id, created_by, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING ${this.CLIENT_COLUMNS}`,
                [
                    name.replaceAll(" ", "_").toLowerCase(),
                    String(business_id),
                    JSON.stringify(address),
                    String(pincode),
                    gst_in,
                    JSON.stringify(ph_no),
                    mail_id.toLowerCase(),
                    String(created_by),
                    String(created_by),
                ]
            );

            return { status: 201, message: "Client created successfully.", data: result.rows, size: result.rowCount };
        }
        catch (error: any) {
            return this.alterClientError(error, "creating");
        }
    }

    /**
     * Client Model - 
     * Used to get the list fo the clients that are created. User ID can be send as param to get the list of the Clients by user Id.
     * @param userId : User Id (Optional)
     * @returns response
     */
    public async getClients(businessId: string, userId?:string) {
        await this.getClient();
        try {
            let result:any;
            if(userId) {
                result = await this.client.query(`SELECT ${this.CLIENT_COLUMNS} FROM ${this.DATABASE_NAME} WHERE business_id = $1 AND id = $2 ORDER BY created_at ${this.ORDER_BY}`,[businessId, userId]);
            }
            else {
                result = await this.client.query(`SELECT ${this.CLIENT_COLUMNS} FROM ${this.DATABASE_NAME} WHERE business_id = $1 ORDER BY created_at ${this.ORDER_BY}`, [businessId]);
            }
            return { status: 200, message: "Clients fetched successfully.", data: result.rows, size: result.rowCount };
        }
        catch (error: any) {
            return this.alterClientError(error, "fetching");
        }
    }

    /**
     * Client Model - 
     * Used to get the list of client based on condition
     * @param condition : Confition to filter Record<string, <T>>
     */
    public async getClientsByCondition(businessId: string, condition: Partial<Pick<IClient, "id" | "name" | "business_id" | "pincode" | "gst_in" | "mail_id" | "created_by">> & { id?: string }) {
        await this.getClient();
        try {

            condition = {business_id: businessId, ...condition};

            const fields = Object.keys(condition).filter(
                f => f in this.CLIENT_SEARCHABLE && (condition as any)[f] !== undefined
            );

            if (fields.length === 0) {
                return { status: 400, message: "No valid condition provided.", data: null };
            }

            const where = fields.map((f, i) => `${this.CLIENT_SEARCHABLE[f]} = $${i + 1}`).join(" AND ");
            const values = fields.map(f => String((condition as any)[f]));

            const result = await this.client.query(
                `SELECT ${this.CLIENT_COLUMNS} FROM ${this.DATABASE_NAME} WHERE ${where} ORDER BY created_at ${this.ORDER_BY}`,
                values
            );

            return { status: 200, message: "Clients fetched successfully.", data: result.rows, size: result.rowCount ?? 0 };
        }
        catch (error: any) {
            return this.alterClientError(error, "fetching");
        }
    }

    /**
     * Client Model - Need to Rework in this function
     * Used to update client.
     * @param id : String
     * @param changes : Update
     * @param created_by: User name
     */
    public async updateClient(businessId: string, id: string, changes: Partial<IClient>, updated_by: string) {
        await this.getClient();
        try {
            const fields = Object.keys(changes).filter(
                f => f in this.CLIENT_UPDATABLE && (changes as any)[f] !== undefined
            );

            if (fields.length === 0) {
                return { status: 400, message: "No valid fields to update.", data: null };
            }

            const setClause = fields.map((f, i) => `${this.CLIENT_UPDATABLE[f]} = $${i + 1}`).join(", ");
            const values = fields.map(f => {
                const value = (changes as any)[f];
                if (this.CLIENT_JSON_FIELDS.includes(f)) return JSON.stringify(value);
                if (f === "pincode") return String(value);
                return value;
            });

            // optional ownership check: only the creator can update
            let where = `business_id = $${fields.length+1} AND id = $${fields.length + 2}`;
            const params: any[] = [...values, businessId, id];

            if (updated_by) {
                params.push(updated_by);
            }

            // this.print.log(`UPDATE ${this.DATABASE_NAME} SET ${setClause}, updated_at = NOW(), updated_by = $${fields.length+3} WHERE ${where} RETURNING ${this.CLIENT_COLUMNS}`, params);

            const result = await this.client.query(
                `UPDATE ${this.DATABASE_NAME}
                SET ${setClause}, updated_at = NOW(), updated_by = $${fields.length+3}
                WHERE ${where}
                RETURNING ${this.CLIENT_COLUMNS}`,
                params
            );

            if (result.rows.length === 0) {
                return { status: 404, message: "Client not found.", data: null };
            }

            return { status: 200, message: "Client updated successfully.", data: result.rows[0] };
        }
        catch (error: any) {
            return this.alterClientError(error, "updating");
        }
    }

    /**
     * Client Model - 
     * Used to implement search in the application
     * @param term : string
     * @returns 
     */
    public async searchClient(businessId: string, term: string) {
        await this.getClient();
        try {
            const result = await this.client.query(
                `SELECT ${this.CLIENT_COLUMNS} FROM ${this.DATABASE_NAME}
                WHERE business_id = $1 AND (name ILIKE $2 OR mail_id ILIKE $2 OR gst_in ILIKE $2)
                ORDER BY created_at ${this.ORDER_BY}`,
                [businessId, `%${term}%`]
            );
            return { status: 200, message: "Client fetched successfully.", data: result.rows, size: result.rowCount ?? 0 };
        } catch (error: any) {
            return this.alterClientError(error, 'fetching');
        }
    }
        
}

export default ClientModel