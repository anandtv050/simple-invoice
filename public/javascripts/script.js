
function calculateTotal() {
        let rows = document.querySelectorAll('#invoiceTable tbody tr');
        let subtotal = 0, totalTax = 0;
    rows.forEach(row => {
        let qty = parseFloat(row.querySelector('[name="qty[]"]').value || 0);
        let price = parseFloat(row.querySelector('[name="price[]"]').value || 0);
        let taxRate = parseFloat(row.querySelector('[name="tax[]"]').value || 0);
        let total = qty * price;
        let tax = total * (taxRate / 100);
        row.querySelector('[name="total[]"]').value = (total + tax).toFixed(2);
        subtotal += total;
        totalTax += tax;
    });

    let discountPercent = parseFloat(document.getElementById("discount").value || 0);
    let discountValue = subtotal * (discountPercent / 100);
    let grandTotal = subtotal + totalTax - discountValue;

    document.getElementById("subtotal").innerText = subtotal.toFixed(2);
    document.getElementById("tax_total").innerText = totalTax.toFixed(2);
    document.getElementById("discount_value").innerText = discountValue.toFixed(2);
    document.getElementById("grand_total").innerText = grandTotal.toFixed(2);
  }

  function addRow() {
    let row = document.querySelector('#invoiceTable tbody tr');
    let clone = row.cloneNode(true);
    clone.querySelectorAll('input').forEach(input => input.value = '');
    document.querySelector('#invoiceTable tbody').appendChild(clone);
  }

  function removeRow(btn) {
    let row = btn.closest('tr');
    let tbody = document.querySelector('#invoiceTable tbody');
    if (tbody.rows.length > 1) {
      row.remove();
      calculateTotal();
    }
  }

  document.querySelectorAll('[name="qty[]"], [name="price[]"], [name="tax[]"]').forEach(input => {
    input.addEventListener('input', calculateTotal);
  });

  function saveInvoice() {

    let arrItemDetails =[];
    document.querySelectorAll("#invoiceTable tbody tr").forEach(row=>{
        let item = {
            strItemName: row.querySelector('[name="desc[]"]').value,
            intItemQty: parseFloat(row.querySelector('[name="qty[]"]').value || 0),
            dblItemprice: parseFloat(row.querySelector('[name="price[]"]').value || 0),
            dblItemtax: parseFloat(row.querySelector('[name="tax[]"]').value || 0),
            dbltotalPrice: parseFloat(row.querySelector('[name="total[]"]').value || 0)
        };
        arrItemDetails.push(item);
    })
    let objInvoiceDetails = {
        "strCustNameAjxKey":$('#strCustName').val(),
        "strCustEmailAjxKey":$('#strCustEmail').val(),
        "strstrInvoiceNoAjxKey" :$('#strInvoiceNo').val(),
        'datDocumentAjxKey' :$('#datDocument').val(),
        'datDueAjxKey':$('#datDue').val(), 
        'arrItemDetailsAjxKey':arrItemDetails
    }

    //check the form valid 
    // validateform()

    $.ajax({
        url: "/submit-invoice",
        contentType: "application/json", // ✅ Important
        method: "post",
        data: JSON.stringify(objInvoiceDetails),
        success:(response)=>{
            console.log("responesave ",response);
            if(response.message == 'SAVE_SUCCESS'){
                alert(response.intInvoiceId)
                getInvoiceDetails(response.intInvoiceId);
            }else{
                alert('save_failed')
            }
        }
    })
  }

  function getInvoiceDetails(intInvoiceId) {
    alert(intInvoiceId)
        $.ajax({
            url:'/get-invoice-details?invPk='+intInvoiceId,
            method:'GET',
            success:(response)=>{
                if(response && response.length>0){
                    console.log("response get invoice ",response);
                    const invoice = response[0];  // Access the first invoice in the array
                    $('#strCustName').val(invoice.vchr_invoice_no); // Replace with actual customer name field if available
                    $('#strCustEmail').val(invoice.vchr_invoice_no); // Replace with actual customer email if available
                    $('#strInvoiceNo').val(invoice.vchr_invoice_no); // Invoice number
                    $('#strInvoiceDate').val(invoice.dat_document); // Document Date
                    $('#strDueDate').val(invoice.dat_due); // Due Date
                    $('#strTax').val(invoice.dbl_inv_tax); // Tax Amount
                    $('#strDiscount').val(invoice.dbl_inv_discount); // Discount Amount
                    $('#strGrandTotal').val(invoice.dbl_grand_total); // Grand Total
                    $('#strRemarks').val(invoice.vchr_remarks); // Remarks if any
alert("saved success")
                    if (invoice.items && invoice.items.length > 0) {
                        const item = invoice.items[0];
                        $('#strItemName').val(item.vchr_item_name); // Item Name
                        $('#strItemQuantity').val(item.int_quantity); // Quantity
                        $('#strItemPrice').val(item.dbl_unit_price); // Unit Price
                        $('#strItemTaxRate').val(item.dbl_taxrate); // Tax Rate
                    }
                }
            }

        })
  }

  //document loading while changing 

  $("#strInvoiceNo").on('change',()=>{
    let strInvoiceNumber = $("#strInvoiceNo").val()
    getDocumentDetailsBynumber(strInvoiceNumber)
  })

  function getDocumentDetailsBynumber(strInvoiceNumber) {
    $.ajax({
        url:'/getDocumentDetailByNumber?invoiceNumber='+strInvoiceNumber,
        method:'GET',
        success:(response)=>{
            if(response && response.length>0){
                console.log("response get invoice ",response);
                const invoice = response[0];  // Access the first invoice in the array
                $('#datDocument').val(invoice.dat_document.split("T")[0]);
                $('#datDue').val(invoice.dat_due.split("T")[0]);
                $('#tax_total').text(invoice.dbl_inv_tax);
                $('#discount').val(invoice.dbl_inv_discount);
                $('#grand_total').text(invoice.dbl_grand_total);
                $('textarea[name="note"]').val(invoice.vchr_remarks || '');
                
            const tbody = $('#invoiceTable tbody');
            tbody.empty(); // Remove existing rows

            invoice.items.forEach(item => {
            const row = `
                <tr>
                <td><input type="text" name="desc[]" value="${item.vchr_item_name}"></td>
                <td><input type="number" name="qty[]" value="${item.int_quantity}" onchange="calculateTotal()"></td>
                <td><input type="number" name="price[]" value="${item.dbl_unit_price}" onchange="calculateTotal()"></td>
                <td><input type="number" name="tax[]" value="${item.dbl_taxrate}" onchange="calculateTotal()"></td>
                <td><input type="text" name="total[]" readonly></td>
                <td><button type="button" onclick="removeRow(this)">🗑️</button></td>
                </tr>`;
            tbody.append(row);
            });

            calculateTotal();

            }
        }

    })
  }

  $("#btnInvoiceDelete").on('click',()=>{
    alert("do you want to delete ?")
    let strDocuemntNo =  $("#strInvoiceNo").val()
    deleteDocument(strDocuemntNo);
  })

  function deleteDocument(strDocuemntNo) {
    if(!strDocuemntNo){
        return;
    }
    $.ajax({
        url:'/deleteDocuemnt?strinvoiceNumber='+strDocuemntNo,
        method:'get',
        success:function(response){
            if(response){
                alert("docuemntDeleted")
            }
        }

    })
  }