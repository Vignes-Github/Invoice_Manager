export interface IBusiness {
    id?: string,
    name: string,
    address: string[],
    pincode: string | number,
    gst_in: string,
    ph_no: string[],
    mail_id: string,
    state: {
        name: string,
        code: number | string
    },
    bank: {
        name: string,
        acc_no: string | number,
        ifsc: string | number,
        branch: string,
        pincode: number | string
    },
    tax: Record<string, any>[],
    created_by: string | number,
    hsn: number | string
}