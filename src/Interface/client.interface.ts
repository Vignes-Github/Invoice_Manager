export interface IClient {
    id?: string,
    name: string,
    business_id: string,
    address: string[],
    pincode: string | number,
    ph_no: string[],
    mail_id: string,
    gst_in: string | number,
    created_by: string | number
}