export { authMiddleware, requirePermission, requireRole } from './middleware.js';
export { hasPermission, getUserPermissions } from './permissions.js';
export { verifyToken, decodeToken } from './jwt.js';
export type { AuthenticatedRequest, JWTPayload } from './types.js';

export { encryptData, decryptData, hashData, generateEncryptionKey } from './encryption.js';

export { ABDMClient } from './abdm.js';
export type { ABDMConfig, HealthRecord } from './abdm.js';

export {
  validateConsent,
  generateConsentNotice,
  checkDataRetention,
  sanitizeForExport,
  generateDeletionCertificate,
  CLINICAL_RETENTION_DAYS,
} from './dpdp.js';
export type { ConsentConfig } from './dpdp.js';

export { createAuditEntry, verifyAuditEntry, buildAuditChain } from './audit.js';
export type { AuditEntry } from './audit.js';
