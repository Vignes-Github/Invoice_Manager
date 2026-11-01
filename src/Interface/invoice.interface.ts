import { IBusiness } from "./business.interface";
import { IClient } from "./client.interface";

export interface IInvoice {
    invoiceNo: string | number,
    bussiness: IBusiness,
    client: IClient,
    particulars: any,
    client_id: string | number,
    created_by: string | number
}