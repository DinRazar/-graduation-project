CREATE DATABASE terms_db;
USE terms_db;

CREATE TABLE terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(255) UNIQUE NOT NULL,
    definition TEXT,
    gost VARCHAR(50)
);