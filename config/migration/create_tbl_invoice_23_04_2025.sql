CREATE TABLE IF NOT EXISTS tbl_invoice (
    pk_bint_invoice_id BIGSERIAL PRIMARY KEY,
    fk_bint_user_id BIGINT REFERENCES tbl_user(pk_bint_user_id) ON DELETE CASCADE,
    fk_bint_customer_id BIGINT REFERENCES tbl_customer(pk_bint_customer_id) ON DELETE CASCADE,
    vchr_invoice_no VARCHAR(50) UNIQUE NOT NULL,
    dat_document DATE NOT NULL,
    dat_due DATE ,
    dbl_inv_tax DECIMAL(10,2) DEFAULT 0,
    dbl_inv_discount DECIMAL(10,2) DEFAULT 0,
    dbl_grand_total DECIMAL(15,2),
    vchr_remarks TEXT,
    chr_status CHAR(1) DEFAULT 'P',
    tim_created TIMESTAMP DEFAULT NOW(),
    tim_modified TIMESTAMP,
    vchr_document_status CHAR(1)
)

