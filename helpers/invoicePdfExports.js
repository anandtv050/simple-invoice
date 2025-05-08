const PDFDocument = require('pdfkit');

var db = require("../config/db");
module.exports = {
  getPdfExports: async (strinvoiceNumber,res) => {
    
    const Result = await db.query(
        "SELECT * FROM tbl_invoice WHERE vchr_invoice_no = $1",
        [strinvoiceNumber]
      );     
      const objInvDetails = Result.rows[0];  
      if (!objInvDetails) throw new Error('Invoice not found');

      const doc = new PDFDocument();
      doc.pipe(res);
    // Header

    doc.fontSize(18).text('Simple Invoice',{align:'center'});
    // doc.moveDown();

    doc.fontSize(12).text(`Invoice ID: ${objInvDetails.vchr_invoice_no}`);
    doc.text(`Client: ${"customer name"}`);
    doc.text(`Total Amount: ₹${objInvDetails.dbl_grand_total}`);
    doc.text(`Date: ${new Date(objInvDetails.dat_document).toLocaleDateString()}`);
    doc.end();

  },
};
