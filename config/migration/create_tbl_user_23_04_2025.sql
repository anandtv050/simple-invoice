CREATE TABLE IF NOT EXISTS tbl_user (
        pk_bint_user_id BIGSERIAL PRIMARY KEY,
        vchr_user_name VARCHAR(100) NOT NULL,
        vchr_user_email VARCHAR(150) NOT NULL,
        vchr_password VARCHAR(255) NOT NULL,
        chr_status CHAR(1) DEFAULT 'A',
        tim_created TIMESTAMP DEFAULT NOW(),
        tim_modified TIMESTAMP,
        vchr_document_status CHAR(1)
)