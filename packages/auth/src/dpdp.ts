import crypto from 'crypto';

/** 3 years per Clinical Establishments (Registration and Regulation) Rules */
export const CLINICAL_RETENTION_DAYS = 1095;

export interface ConsentConfig {
  purpose: string;
  dataCategories: string[];
  thirdParties: string[];
  retentionPeriodDays: number;
}

interface ConsentValidationResult {
  isValid: boolean;
  issues: string[];
}

interface RetentionCheckResult {
  isExpired: boolean;
  daysRemaining: number;
}

interface DeletionCertificate {
  certificateId: string;
  userId: string;
  dataCategories: string[];
  deletedAt: string;
  checksum: string;
}

export function validateConsent(consent: Record<string, unknown>): ConsentValidationResult {
  const issues: string[] = [];

  if (!consent.purpose || typeof consent.purpose !== 'string' || consent.purpose.trim().length === 0) {
    issues.push('Consent must specify a clear purpose (DPDP Section 6 — specific)');
  }

  if (!consent.dataCategories || !Array.isArray(consent.dataCategories) || consent.dataCategories.length === 0) {
    issues.push('Consent must list data categories being collected (DPDP Section 6 — informed)');
  }

  if (consent.givenFreely !== true) {
    issues.push('Consent must be given freely without coercion (DPDP Section 6 — free)');
  }

  if (!consent.consentTimestamp || typeof consent.consentTimestamp !== 'string') {
    issues.push('Consent must include a timestamp to prove it was given (DPDP Section 6 — unambiguous)');
  }

  if (!consent.dataProcessorIdentity || typeof consent.dataProcessorIdentity !== 'string') {
    issues.push('Consent must identify the Data Fiduciary processing the data (DPDP Section 5)');
  }

  if (consent.retentionPeriodDays === undefined || typeof consent.retentionPeriodDays !== 'number') {
    issues.push('Consent must specify a data retention period (DPDP Section 8)');
  }

  if (!consent.withdrawalMethod || typeof consent.withdrawalMethod !== 'string') {
    issues.push('Consent notice must describe how to withdraw consent (DPDP Section 6(6))');
  }

  if (!consent.grievanceContact || typeof consent.grievanceContact !== 'string') {
    issues.push('Must provide contact for grievance redressal (DPDP Section 11)');
  }

  return { isValid: issues.length === 0, issues };
}

export function generateConsentNotice(config: ConsentConfig): string {
  const thirdPartySection =
    config.thirdParties.length > 0
      ? `Your data may be shared with the following parties: ${config.thirdParties.join(', ')}. ` +
        `Each party is bound by data protection obligations under the DPDP Act, 2023.`
      : 'Your data will not be shared with any third parties.';

  return [
    `CONSENT NOTICE`,
    ``,
    `Purpose of Data Collection:`,
    `${config.purpose}`,
    ``,
    `Categories of Data Collected:`,
    ...config.dataCategories.map((cat) => `  - ${cat}`),
    ``,
    `Data Sharing:`,
    thirdPartySection,
    ``,
    `Retention Period:`,
    `Your data will be retained for ${config.retentionPeriodDays} days from the date of collection, ` +
      `unless a longer period is required by law (e.g., Clinical Establishments Rules mandate ` +
      `${CLINICAL_RETENTION_DAYS} days for medical records).`,
    ``,
    `Your Rights (DPDP Act, 2023):`,
    `  - Right to access a summary of your personal data and processing activities`,
    `  - Right to correction and erasure of your personal data`,
    `  - Right to grievance redressal`,
    `  - Right to nominate another person to exercise your rights`,
    ``,
    `Withdrawal of Consent:`,
    `You may withdraw consent at any time. Withdrawal does not affect the lawfulness ` +
      `of processing performed before withdrawal.`,
  ].join('\n');
}

export function checkDataRetention(
  createdAt: Date,
  retentionDays: number
): RetentionCheckResult {
  const now = new Date();
  const elapsedMs = now.getTime() - createdAt.getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, Math.ceil(retentionDays - elapsedDays));

  return {
    isExpired: elapsedDays >= retentionDays,
    daysRemaining,
  };
}

export function sanitizeForExport(
  data: Record<string, unknown>,
  allowedFields: string[]
): Record<string, unknown> {
  const allowed = new Set(allowedFields);
  const result: Record<string, unknown> = {};

  for (const field of allowed) {
    if (field in data) {
      result[field] = data[field];
    }
  }

  return result;
}

export function generateDeletionCertificate(
  userId: string,
  dataCategories: string[]
): DeletionCertificate {
  const deletedAt = new Date().toISOString();
  const certificateId = crypto.randomUUID();
  const payload = JSON.stringify({ certificateId, userId, dataCategories, deletedAt });
  const checksum = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');

  return {
    certificateId,
    userId,
    dataCategories,
    deletedAt,
    checksum,
  };
}
