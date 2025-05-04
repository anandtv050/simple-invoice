const { Client } = require("pg");
var db = require("../config/db");
const format = require('pg-format');
const { json } = require("express");

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
            //check update , delete existing rows 
            if(objInvDetails.blnSaveOrUpdateAjxKey =='UPDATE'){
                
                //check the invoice exist or not if exist take invoicepk 
                const objResult = await client.query(`SELECT pk_bint_invoice_id FROM tbl_invoice WHERE vchr_invoice_no =$1 AND vchr_document_status ='N'`,[strInvoiceNo])
                if(objResult.rows.length===0) {
                    throw new Error(`Invoice number ${strInvoiceNo} not found for update`);
                }
                intInvoicePk = objResult.rows[0].pk_bint_invoice_id;
                    // await client.query(`UPDATE tbl_invoice SET vchr_document_status ='M' WHERE pk_bint_invoice_id =$1`,[intInvoicePk])
                    await client.query('DELETE FROM tbl_invoice WHERE pk_bint_invoice_id = $1',[intInvoicePk])

                    await client.query('DELETE FROM tbl_invoice_items WHERE fk_bint_invoice_id = $1',[intInvoicePk])
                
            }else {
                const blnInvoiceNoExist = await client.query(`
                    SELECT 1 FROM tbl_invoice WHERE vchr_invoice_no =$1 `,[strInvoiceNo])
                    if (blnInvoiceNoExist.rowCount > 0) {
                        // If the invoice number already exists, return an error
                        throw new Error(`Invoice number ${strInvoiceNo} already exists`);
                    }
            }
            //insert into tbl_invoice
            const parsedDueDate = (datDue && datDue.trim() !== '') ? datDue : null;
            //check the document no already exist 
            
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
        await client.query(`UPDATE tbl_invoice SET vchr_document_status = 'D' WHERE vchr_invoice_no = $1`,[strInvoiceNo]);
            console.log("deleted    e",strInvoiceNo);
            return true;

    },
    getReportDetails: async (searchFilters) => {
        const client = await db.connect();
        try {

        const firstKey = Object.keys(searchFilters)[0];

        let parsedFilters = {};
        try {
        parsedFilters = JSON.parse(firstKey);
        } catch (e) {
        console.error('Failed to parse search filters:', e);
        }
            console.log('Received filters:', parsedFilters);

            const conditions = [];
            const params = [];
            let paramIndex = 1;
    
            // 1. Invoice Number (exact match)
            if (parsedFilters.strInvoiceNoAjxKey) {
                conditions.push(`inv.vchr_invoice_no = $${paramIndex}`);
                params.push(parsedFilters.strInvoiceNoAjxKey);
                paramIndex++;
            }
    
            // 2. Customer Name (case-insensitive partial match)
            if (parsedFilters.strCustomerNameAjxKey) {
                conditions.push(`c.vchr_cust_name ILIKE $${paramIndex}`);
                params.push(`%${parsedFilters.strCustomerNameAjxKey}%`);
                paramIndex++;
            }
    
            // 3. Date Range (document date)
            if (parsedFilters.datDocFromAjxKey) {
                conditions.push(`inv.dat_document >= $${paramIndex}`);
                params.push(parsedFilters.datDocFromAjxKey);
                paramIndex++;
            }
            if (parsedFilters.datDOcToAjxKey) {
                conditions.push(`inv.dat_document <= $${paramIndex}`);
                params.push(parsedFilters.datDOcToAjxKey);
                paramIndex++;
            }
    
            // Build the query
            const baseQuery = `
                SELECT 
                    inv.pk_bint_invoice_id AS id,
                    inv.vchr_invoice_no AS "invoiceNo",
                    TO_CHAR(inv.dat_document, 'YYYY-MM-DD') AS "docDate",
                    TO_CHAR(inv.dat_due, 'YYYY-MM-DD') AS "dueDate",
                    c.vchr_cust_name AS "customerName",
                    inv.dbl_grand_total AS "grandTotal",
                    inv.vchr_document_status AS status,
                    inv.vchr_remarks AS remarks,
                    (
                        SELECT COALESCE(
                            json_agg(
                                json_build_object(
                                    'name', i.vchr_item_name,
                                    'quantity', i.int_quantity,
                                    'price', i.dbl_unit_price
                                )
                            ), 
                            '[]'::json
                        )
                        FROM tbl_invoice_items i
                        WHERE i.fk_bint_invoice_id = inv.pk_bint_invoice_id
                    ) AS items
                FROM tbl_invoice inv
                LEFT JOIN tbl_customer c ON inv.fk_bint_customer_id = c.pk_bint_customer_id
            `;
    
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const orderClause = `ORDER BY inv.dat_document DESC LIMIT 100`;
            const fullQuery = `${baseQuery} ${whereClause} ${orderClause}`;

            const result = await client.query(fullQuery, params);
            return result.rows;
    
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}
