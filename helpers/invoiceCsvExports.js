const {format} = require('@fast-csv/format');
var db = require("../config/db");

exports.getCsvExports = async (req,res)=>{
    try{
        res.setHeader('Content-Disposition','attachment; filename="invoices.csv"');
        res.setHeader('content-Type','text/csv');

        const QueryStream = await db.query(`SELECT * FROM tbl_invoice`);

        const csvStream = format({headers:true});
        csvStream.pipe(res);

        QueryStream.rows.forEach(row=>{
            csvStream.write(row)
        })
        csvStream.end();

    } catch(error) {
        console.error('CSV Export Error:', err);
        res.status(500).send('Internal Server Error');
    }
}
