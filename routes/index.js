var express = require("express");
var router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

var invoiceHelper = require("../helpers/invoiceHelper");
var csvExport = require("../helpers/invoiceCsvExports");
var excelExports = require("../helpers/invoiceExcelExports");
var pdfExports = require("../helpers/invoicePdfExports");
var voiceHelper = require("../helpers/voiceHelper");

const { response } = require("../app");
const { body, validationResult } = require('express-validator'); // <== Make sure this line exists
const { Result } = require("pg");



router.get("/login",async(req,res)=>{
  res.render("login")
})

router.get("/sign-up",async(req,res)=>{
  res.render("sign-up")
})

router.post("/signup",async(req,res)=>{
   let rstResult;
  rstResult  = await invoiceHelper.UserSIgnUp(req.body)
  
})

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/invoice", (req, res) => {
  res.render("invoice");
});

router.post("/submit-invoice",
  [
    body("strCustNameAjxKey").trim().notEmpty().withMessage("Customer Name Required"),
    body("strCustEmailAjxKey").isEmail().withMessage("Valid Email is required"),
    body("strstrInvoiceNoAjxKey").trim().notEmpty().withMessage("Invoice No is required"),
    body("datDocumentAjxKey").notEmpty().withMessage("Document Date is required"),
    body("discount").optional().isFloat({ min: 0, max: 100 }).withMessage("Discount must be between 0 and 100"),
    // Validate each item inside arrItemDetailsAjxKey
    body("arrItemDetailsAjxKey.*.strItemName").notEmpty().withMessage("Item name is required"),
    body("arrItemDetailsAjxKey.*.intItemQty").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("arrItemDetailsAjxKey.*.dblItemprice").isFloat({ min: 0 }).withMessage("Price must be 0 or more"),
    body("arrItemDetailsAjxKey.*.dblItemtax").optional().isFloat({ min: 0 }).withMessage("Tax must be 0 or more"),
  ],
  
  
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ message: "VALIDATION_ERROR", errors: errors.array() });
  }
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

router.post("/voice-invoice",
             upload.single("audio"), voiceHelper.processVoice
            );


module.exports = router;
