-- Roles: CUSTOMER = 0, TELLER = 1, ADMIN = 2.  The intermediate VARCHAR makes
-- this safe for the project's earlier ENUM/string role column as well.
ALTER TABLE users MODIFY role VARCHAR(16) NOT NULL DEFAULT 'CUSTOMER';
UPDATE users
   SET role = CASE role
     WHEN 'CUSTOMER' THEN '0'
     WHEN 'TELLER' THEN '1'
     WHEN 'ADMIN' THEN '2'
     ELSE role
   END;
ALTER TABLE users MODIFY role TINYINT UNSIGNED NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS biometric_credentials (
  biometric_credential_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  credential_id VARCHAR(255) NOT NULL,
  template_reference VARCHAR(512) NOT NULL,
  device_id VARCHAR(255) NULL,
  status ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_biometric_credential (user_id, credential_id),
  CONSTRAINT fk_biometric_credentials_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS biometric_sessions (
  session_id CHAR(36) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_biometric_sessions_validity (user_id, expires_at),
  CONSTRAINT fk_biometric_sessions_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
