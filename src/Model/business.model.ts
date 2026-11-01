import PostgresConnection from "../Database/connection";
import { IBusiness } from "../Interface/business.interface";
import Print from "../Utils/print.utils";
import {PoolClient} from 'pg'

class BusinessModel {
    private readonly print:Print = new Print("Business Model");

    // Database
    private dbInstance!:PostgresConnection;
    private client!:PoolClient;

    private readonly DATABASE_NAME:string = "business";

    // returned columns, aliased to camelCase to match IBusiness
    private readonly BUSINESS_COLUMNS = `
        id, name, address, pincode,
        gst_in, ph_no, mail_id,
        state, bank, tax, hsn,
        created_by,
        created_at, updated_at
    `;

    // camelCase field -> db column (whitelist, so request data can never choose a column name)
    private readonly BUSINESS_UPDATABLE: Record<string, string> = {
        name: "name",
        address: "address",
        pincode: "pincode",
        gst_in: "gst_in",
        ph_no: "ph_no",
        mail_id: "mail_id",
        state: "state",
        bank: "bank",
        tax: "tax",
        hsn: "hsn"
    };

    private readonly BUSINESS_JSON_FIELDS = ["address", "ph_no", "state", "bank", "tax"];

    // fields allowed in getBusinessByCondition (scalar columns only)
    private readonly BUSINESS_SEARCHABLE: Record<string, string> = {
        id: "id",
        name: "name",
        pincode: "pincode",
        gst_in: "gst_in",
        mail_id: "mail_id",
        created_by: "created_by",
        hsn: "hsn"
    };
        
    private readonly ORDER_BY:string = process.env.GET_ORDER_BY as string ?? "ASC";


    constructor() {
        this.print.log('Bussiness Model is used in this service');
        this.dbInstance = PostgresConnection.instance;
    }

    private async getClient() {
        if(this.client) {
            return this.client
        }

        this.client = await this.dbInstance.getClient();
        return this.client
    }

    private async alterBussinessError(error:any, action:string) {
        this.print.error(`Error Happenend while ${action} business \n`, error.message);

        if (error.code === "23505") {
            const messages: Record<string, string> = {
                business_name_key: "A business with this name already exists.",
                business_gst_in_key: "A business with this GST IN already exists.",
                business_mail_id_key: "A business with this mail id already exists.",
            };
            return {
                status: 409,
                message: messages[error.constraint] ?? "Business already exists.",
                data: null,
            };
        }
        
        if (error.code === "22P02") {
            return { status: 400, message: "Invalid id.", data: null };
        }
        if (error.code === "22001") {
            return { status: 400, message: "One of the values is too long (check name, pincode, GSTIN, mail id).", data: null };
        }
        return { status: 500, message: `Error Happenend while ${action} business`, data: null };
    }

    /**
     * Business Model - 
     * Used to create a business table if not exists in the database
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
                id          UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
                name        VARCHAR(120) NOT NULL UNIQUE,
                address     JSONB NOT NULL DEFAULT '[]',
                pincode     VARCHAR(10) NOT NULL,
                hsn         VARCHAR(20) NOT NULL UNIQUE,
                gst_in      VARCHAR(15) NOT NULL UNIQUE,
                ph_no       JSONB NOT NULL DEFAULT '[]',
                mail_id     VARCHAR(120) NOT NULL UNIQUE,
                state       JSONB NOT NULL,
                bank        JSONB NOT NULL,
                tax         JSONB NOT NULL DEFAULT '[]',
                created_by  UUID NOT NULL,
                updated_by  UUID NOT NULL,
                created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_business_created_by ON business (created_by);
        `);

        this.print.log('Table Created Successfully.');
    }

    /**
     * Business Model - 
     * Used to create a new business entry in database
     * @param payload : IBusiness
     * @returns : result
     */
    public async createBusiness(payload: IBusiness) {
        await this.getClient();

        if (!this.client) {
            this.print.error('Client not created, ABORTING');
            throw new Error('No Client is created to proceed with this operation.');
        }

        try {
            const { name, address, pincode, ph_no, gst_in, mail_id, state, hsn, bank, tax, created_by } = payload;

            const result = await this.client.query(
                `INSERT INTO ${this.DATABASE_NAME}
                    (name, address, pincode, hsn, gst_in, ph_no, mail_id, state, bank, tax, created_by, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING
                    id, name, address, pincode, hsn,
                    gst_in, ph_no, mail_id,
                    state, bank, tax,
                    created_by, updated_by, created_at, updated_at`,
                [
                    name.replaceAll(" ", "_").toLowerCase(),
                    JSON.stringify(address),
                    String(pincode),
                    String(hsn),
                    gst_in,
                    JSON.stringify(ph_no),
                    mail_id.toLowerCase(),
                    JSON.stringify(state),
                    JSON.stringify(bank),
                    JSON.stringify(tax ?? []),
                    String(created_by),
                    String(created_by),
                ]
            );

            return { status: 201, message: "Business created successfully.", data: result.rows[0] };
        }
        catch (error: any) {
            return this.alterBussinessError(error, 'creating')
        }
    }

    /**
     * Business Model - 
     * Used to get the list of business that are created and also can be filtered by the user that created
     * @param userId : user ID
     * @returns response
     */
    public async getBusiness(userId?:string) {
        try {
            let result:any;

            if(userId) {
                result = await this.client.query(`SELECT * FROM ${this.DATABASE_NAME} WHERE id=$1 ORDER BY created_at ${this.ORDER_BY}`, [userId]);
            }
            else {
                result = await this.client.query(`SELECT * FROM ${this.DATABASE_NAME} ORDER BY created_at ${this.ORDER_BY}`);
            }

            this.print.log(`Business fetched successfully.`);
            return { status: 200, message: "Business fetched successfully.", data:result.rows, size: result.rowCount ?? 0};
        } 
        catch (error) {
            return this.alterBussinessError(error, 'fetching');
        }
    }

    /**
     * Business Model - 
     * Used to get the business based on a condition - Ideal for Search
     * @param condition : Condition to search
     * @returns response
     */
    public async getBusinessByCondition(condition: Partial<Pick<IBusiness, "id" | "name" | "pincode" | "gst_in" | "mail_id" | "created_by">> & { id?: string }) {
        await this.getClient();

        try {
            const fields = Object.keys(condition).filter(
                f => f in this.BUSINESS_SEARCHABLE && (condition as any)[f] !== undefined
            );

            if (fields.length === 0) {
                return { status: 400, message: "No valid condition provided.", data: null };
            }

            const where = fields.map((f, i) => `${this.BUSINESS_SEARCHABLE[f]} = $${i + 1}`).join(" AND ");
            const values = fields.map(f => String((condition as any)[f]));

            const result = await this.client.query(
                `SELECT ${this.BUSINESS_COLUMNS} FROM ${this.DATABASE_NAME} WHERE ${where} ORDER BY created_at ${this.ORDER_BY}`,
                values
            );

            return { status: 200, message: "Business fetched successfully.", data: result.rows , size: result.rowCount ?? 0};
        }
        catch (error: any) {
            return this.alterBussinessError(error, 'fetching');
        }
    }

    /**
     * Business Model - 
     * Used to update a business that is created.
     * @param id : Business ID
     * @param changes : Updates
     * @param createdBy : User ID
     * @returns response
     */
    public async updateBusiness(id: string, changes: Partial<IBusiness>, updated_by: string) {
        await this.getClient();

        try {
            const fields = Object.keys(changes).filter(
                f => f in this.BUSINESS_UPDATABLE && (changes as any)[f] !== undefined
            );

            if (fields.length === 0) {
                return { status: 400, message: "No valid fields to update.", data: null };
            }

            const setClause = fields.map((f, i) => `${this.BUSINESS_UPDATABLE[f]} = $${i + 1}`).join(", ");
            const values = fields.map(f => {
                const value = (changes as any)[f];
                if (this.BUSINESS_JSON_FIELDS.includes(f)) return JSON.stringify(value);
                if (f === "pincode") return String(value);
                return value;
            });

            // optional ownership check: only the creator can update
            let where = `id = $${fields.length + 1}`;
            const params: any[] = [...values, id];

            if (updated_by) {
                params.push(updated_by);
            }

            // this.print.log(`UPDATE ${this.DATABASE_NAME} SET ${setClause}, updated_at = NOW(), updated_by = $${fields.length + 2} WHERE ${where} RETURNING ${this.BUSINESS_COLUMNS}`, params);

            const result = await this.client.query(
                `UPDATE ${this.DATABASE_NAME}
                    SET ${setClause}, updated_at = NOW(), updated_by = $${fields.length + 2}
                    WHERE ${where}
                    RETURNING ${this.BUSINESS_COLUMNS}`,
                params
            );

            if (result.rows.length === 0) {
                return { status: 404, message: "Business not found.", data: null };
            }

            return { status: 200, message: "Business updated successfully.", data: result.rows[0], size: result.rowCount ?? 0};
        }
        catch (error: any) {
            return this.alterBussinessError(error, 'editing')
        }
    }

    /**
     * Business Model - 
     * Used to implement search in the application
     * @param term : string
     * @returns 
     */
    public async searchBusiness(term: string) {
        await this.getClient();
        try {
            const result = await this.client.query(
                `SELECT ${this.BUSINESS_COLUMNS} FROM ${this.DATABASE_NAME}
                WHERE name ILIKE $1 OR mail_id ILIKE $1 OR gst_in ILIKE $1
                ORDER BY created_at ${this.ORDER_BY}`,
                [`%${term}%`]
            );
            return { status: 200, message: "Business fetched successfully.", data: result.rows, size: result.rowCount ?? 0 };
        } catch (error: any) {
            return this.alterBussinessError(error, 'fetching');
        }
    }
}

export default BusinessModel;