const ExcelJS = require('exceljs');
var db = require("../config/db");

module.exports ={
    getExcelExports: async (req,res) =>{

        const QueryStream = await db.query(`SELECT * FROM tbl_invoice`);

        const workbook = new ExcelJS.Workbook(); // ✅ lowercase w
        const worksheet = workbook.addWorksheet('Invoice Report');

        worksheet.columns =[
            {header: 'Invoice No' , key:'invoice_no', width:15},
            {header:'Document Date', key:'document_date', width:20},
            {header:'Total Amount', key:'total_amount', width:15}
        ]

        arrRows = QueryStream.rows;

        arrRows.forEach(row=>{
            worksheet.addRow({
                invoice_no : row.vchr_invoice_no,
                document_date : row.dat_document,
                total_amount: row.dbl_grand_total
            })
        })

        worksheet.getRow(1).font = {bold:true};
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } 
}

