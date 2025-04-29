CREATE TABLE IF NOT EXISTS tbl_invoice_items (
    pk_bint_invoice_item_id BIGSERIAL PRIMARY KEY,
    fk_bint_invoice_id BIGINT REFERENCES tbl_invoice(pk_bint_invoice_id) ON DELETE CASCADE,
    vchr_item_name VARCHAR(300) NOT NULL,
    int_quantity INTEGER DEFAULT 1,
    dbl_unit_price DECIMAL(10, 2) NOT NULL,
    dbl_taxrate DECIMAL(5, 2) DEFAULT 0,
    tim_created TIMESTAMP DEFAULT NOW(),
    tim_modified TIMESTAMP,
    vchr_document_status CHAR(1)
)