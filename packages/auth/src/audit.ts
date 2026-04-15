import crypto from 'crypto';

export interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  checksum: string;
}

type AuditInput = Omit<AuditEntry, 'checksum'>;

interface AuditChainResult {
  isValid: boolean;
  brokenAt?: number;
}

function computeChecksum(entry: AuditInput): string {
  const payload = JSON.stringify({
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    previousData: entry.previousData,
    newData: entry.newData,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    timestamp: entry.timestamp,
  });

  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

export function createAuditEntry(entry: AuditInput): AuditEntry {
  return {
    ...entry,
    checksum: computeChecksum(entry),
  };
}

export function verifyAuditEntry(entry: AuditEntry): boolean {
  const { checksum, ...rest } = entry;
  return computeChecksum(rest) === checksum;
}

export function buildAuditChain(entries: AuditEntry[]): AuditChainResult {
  for (let i = 0; i < entries.length; i++) {
    if (!verifyAuditEntry(entries[i])) {
      return { isValid: false, brokenAt: i };
    }

    if (i > 0) {
      const prev = entries[i - 1];
      const prevTimestamp = new Date(prev.timestamp).getTime();
      const currTimestamp = new Date(entries[i].timestamp).getTime();

      if (currTimestamp < prevTimestamp) {
        return { isValid: false, brokenAt: i };
      }
    }
  }

  return { isValid: true };
}
