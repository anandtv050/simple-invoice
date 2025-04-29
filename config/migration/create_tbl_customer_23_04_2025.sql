CREATE TABLE IF NOT EXISTS  tbl_customer (
    pk_bint_customer_id BIGSERIAL PRIMARY KEY,
    fk_bint_user_id BIGINT REFERENCES tbl_user(pk_bint_user_id) ON DELETE CASCADE,
    vchr_cust_name VARCHAR(100) NOT NULL,
    vchr_cust_email VARCHAR(150) NOT NULL,
    vchr_cust_address TEXT,
    chr_status CHAR(1) DEFAULT 'A',
    tim_created TIMESTAMP DEFAULT NOW(),
    tim_modified TIMESTAMP,
    vchr_document_status CHAR(1)
)