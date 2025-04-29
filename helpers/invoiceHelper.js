var db = require("../config/db");
const format = require('pg-format');


module.exports = {

    saveinvoice: async(objInvDetails)=>{
        
        const client = await db.connect();

        try{
            await client.query('BEGIN');
            const {
                strCustNameAjxKey: strCustomerName,
                strCustEmailAjxKey: strCustEmail,
                strstrInvoiceNoAjxKey: strInvoiceNo,
                datDocumentAjxKey: datDOcument,
                datDueAjxKey: datDue,
                note,
                discount = 0,
                arrItemDetailsAjxKey: items
            } = objInvDetails;
            
            //insert into tbl_invoice
            const parsedDueDate = (datDue && datDue.trim() !== '') ? datDue : null;
            //check the document no already exist 
            const blnInvoiceNoExist = await client.query(`
                SELECT 1 FROM tbl_invoice WHERE vchr_invoice_no =$1 `,[strInvoiceNo])
                if (blnInvoiceNoExist.rowCount > 0) {
                    // If the invoice number already exists, return an error
                    throw new Error(`Invoice number ${strInvoiceNo} already exists`);
                }
            const invoiceResult = await client.query(
                `INSERT INTO tbl_invoice (
                  fk_bint_user_id, fk_bint_customer_id, vchr_invoice_no,
                  dat_document, dat_due, dbl_inv_discount, dbl_grand_total,
                  vchr_remarks, chr_status, vchr_document_status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING pk_bint_invoice_id`,
                [1, 1, strInvoiceNo, datDOcument, parsedDueDate, discount, 100, note, 'P', 'N']
              );
            
            const invoiceId = invoiceResult.rows[0].pk_bint_invoice_id;
            console.log("invoiceId",invoiceId);
            
            // Prepare bulk insert values
            const invoiceItemsData = [];
            for (let i = 0; i < items.length; i++) {
                const { strItemName, intItemQty, dblItemprice, dblItemtax } = items[i];
                
                invoiceItemsData.push([
                    invoiceId,   
                    strItemName,     
                    intItemQty,      
                    dblItemprice,    
                    dblItemtax,      
                    'N'              
                ]);
            }
            console.log("invoiceItemsData",invoiceItemsData);
            
              const insertQuery = format(`
                INSERT INTO tbl_invoice_items (
                    fk_bint_invoice_id,
                    vchr_item_name,
                    int_quantity,
                    dbl_unit_price,
                    dbl_taxrate,
                    vchr_document_status
                ) VALUES %L
            `, invoiceItemsData);
            await client.query(insertQuery);
            await client.query('COMMIT'); // ✅ Important
            console.log("complete");
            
            return {success:true,message:'SAVE_SUCCESS',invpk:invoiceId}

        }catch(error){
            console.log("error",error); 
            await client.query('ROLLBACK');
            return { success: false, error };
        }
    },
    getInvoiceDetails: async(intInvoicePk)=>{
        console.log("intInvoicePk from get sale ",intInvoicePk);
        
        const client = await db.connect();
        try{

        
        strQuery = `SELECT 
                        i.pk_bint_invoice_id,
                        i.vchr_invoice_no,
                        i.dat_document,
                        i.dat_due,
                        i.dbl_inv_tax,
                        i.dbl_inv_discount,
                        i.dbl_grand_total,
                        i.vchr_remarks,
                        i.chr_status,
                        json_agg(
                            json_build_object(
                            'pk_bint_invoice_item_id', ii.pk_bint_invoice_item_id,
                            'vchr_item_name', ii.vchr_item_name,
                            'int_quantity', ii.int_quantity,
                            'dbl_unit_price', ii.dbl_unit_price,
                            'dbl_taxrate', ii.dbl_taxrate
                            )
                        ) AS items
                        FROM tbl_invoice i
                        JOIN tbl_invoice_items ii  ON i.pk_bint_invoice_id = ii.fk_bint_invoice_id
                        WHERE i.pk_bint_invoice_id = $1
                        GROUP BY i.pk_bint_invoice_id
                        `;

        const result = await client.query(strQuery,[intInvoicePk]) 
        if (result.rows.length === 0) {
            console.log(`No invoice found with invPk: ${intInvoicePk}`);
        }
        
        console.log("RESULTSS", result);
        return result.rows;  // Return the rows
        }catch(error) {
            console.error("Error executing query:", error);
            throw new Error("Failed to fetch invoice details.");
        }finally {
            client.release();  // Ensure the connection is released back to the pool
        }
    },
    getDocumentDetailsByNumber:async(strInvoiceNumber)=>{
        const client = await db.connect();
        try{

        
        strQuery = `SELECT 
                        i.pk_bint_invoice_id,
                        i.vchr_invoice_no,
                        i.dat_document,
                        i.dat_due,
                        i.dbl_inv_tax,
                        i.dbl_inv_discount,
                        i.dbl_grand_total,
                        i.vchr_remarks,
                        i.chr_status,
                        json_agg(
                            json_build_object(
                            'pk_bint_invoice_item_id', ii.pk_bint_invoice_item_id,
                            'vchr_item_name', ii.vchr_item_name,
                            'int_quantity', ii.int_quantity,
                            'dbl_unit_price', ii.dbl_unit_price,
                            'dbl_taxrate', ii.dbl_taxrate
                            )
                        ) AS items
                        FROM tbl_invoice i
                        JOIN tbl_invoice_items ii  ON i.pk_bint_invoice_id = ii.fk_bint_invoice_id
                        WHERE i.vchr_invoice_no = $1
                        GROUP BY i.pk_bint_invoice_id`;

        const result = await client.query(strQuery,[strInvoiceNumber]) 
        if (result.rows.length === 0) {
            console.log(`No invoice found with invoicenumber: ${strInvoiceNumber}`);
        }
        
        console.log("loaddetails", result);
        return result.rows;  // Return the rows
        }catch(error) {
            console.error("Error executing query 1:", error);
            throw new Error("Failed to fetch document details.");
        }finally {
            client.release();  // Ensure the connection is released back to the pool
        }
    },
    deleteDocument: async (strInvoiceNo)=> {
        const client = await db.connect();
        const blnInvoiceNoExist = await client.query(` SELECT 1 FROM tbl_invoice WHERE vchr_invoice_no =$1 `,[strInvoiceNo])
            if ( blnInvoiceNoExist.rowCount === 0) {
                return false
                }
        await client.query(`UPDATE tbl_invoice SET vchr_document_status = 'D' WHERE vchr_invoice_no = $1`,
            [strInvoiceNo]);
            console.log("deleted    e",strInvoiceNo);
            return true;

    }
}
