var express = require("express");
var router = express.Router();
var invoiceHelper = require("../helpers/invoiceHelper");
var csvExport = require("../helpers/invoiceCsvExports");
var excelExports = require("../helpers/invoiceExcelExports");
var pdfExports = require("../helpers/invoicePdfExports");
const { response } = require("../app");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/invoice", (req, res) => {
  res.render("invoice");
});

router.post("/submit-invoice", async (req, res) => {
  console.log("req.body", req.body);

  const objResponse = await invoiceHelper.saveinvoice(req.body);
  console.log("saverespo", objResponse);

  if (objResponse.success && objResponse.invpk) {
    // const rstInvoiceDetails =await  invoiceHelper.getInvoiceDetails(objResponse.invpk)
    res.json({ message: "SAVE_SUCCESS", intInvoiceId: objResponse.invpk });
  } else {
    res.json({ message: "SAVE_FAILED" });
  }
});

router.get("/get-invoice-details", async (req, res) => {
  const invPk = req.query.invPk;
  console.log("invPK:", invPk);

  const rstInvoiceDetails = await invoiceHelper.getInvoiceDetails(invPk);
  res.json(rstInvoiceDetails);
});

router.get("/getDocumentDetailByNumber", async (req, res) => {
  const strInvoiceNumber = req.query.invoiceNumber;
  const rstInvoiceDetails = await invoiceHelper.getDocumentDetailsByNumber(
    strInvoiceNumber
  );
  res.json(rstInvoiceDetails);
});

router.get("/deleteDocuemnt", async (req, res) => {
  const strInvoiceNumber = req.query.strinvoiceNumber;
  console.log("lets delete", strInvoiceNumber);
  const rstInvoice = await invoiceHelper.deleteDocument(strInvoiceNumber);
  if (rstInvoice) {
    res.json({ message: "DELETE_SUCCESS", incoiceNo: strInvoiceNumber });
  }
});

router.get("/activity-report", async (req, res) => {
  res.render("activity-report");
});

router.post("/getreportdetails", async (req, res) => {
  const rawKeys = Object.keys(req.body);

  const arrReportDetails = await invoiceHelper.getReportDetails(req.body);
  console.log("arrReportDetails", arrReportDetails);

  res.json({ message: "SUCCESS", arrReportDetails: arrReportDetails });
});

router.get("/export-csv", csvExport.getCsvExports);

router.get("/export-excel", excelExports.getExcelExports);

router.get("/export-pdf", async (req, res) => {
  const { invoiceNumber } = req.query;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceNumber}.pdf`);

  await pdfExports.getPdfExports(invoiceNumber, res);
});

module.exports = router;
