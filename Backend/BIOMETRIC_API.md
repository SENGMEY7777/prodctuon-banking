# Biometric authentication API

All biometric endpoints require `Authorization: Bearer <JWT>`. The roles are
`CUSTOMER: 0`, `TELLER: 1`, and `ADMIN: 2`.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/biometrics/enroll` | Enroll or re-enable a credential for the authenticated user. Body: `credentialId`, `templateReference`, optional `deviceId`. |
| `POST /api/auth/biometrics/authenticate` | Complete face verification and issue a short-lived step-up session. Body: `credentialId`, `verificationTimestamp`, `verificationSignature`. |
| `POST /api/auth/biometrics/session/verify` | Check a step-up session before a protected sub-process. Body: `biometricSessionToken`. |
| `POST /api/auth/biometrics/revoke` | Revoke the caller's credential(s). An admin may also include `userId` to revoke another user's credentials. |

The biometric provider must HMAC-SHA256 the exact string
`{userId}:{credentialId}:{verificationTimestamp}` with
`BIOMETRIC_PROVIDER_SECRET`; the hexadecimal digest is `verificationSignature`.
Proofs older than two minutes are rejected. Apply
[`migrations/001_biometric_auth.sql`](migrations/001_biometric_auth.sql) before
calling these endpoints. Store only a provider template reference, never face
images or raw biometric templates.
