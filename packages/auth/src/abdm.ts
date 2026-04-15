export interface ABDMConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
}

export interface HealthRecord {
  recordId: string;
  recordType: string;
  facilityId: string;
  date: string;
  data: Record<string, unknown>;
}

interface AbhaCreateParams {
  name: string;
  yearOfBirth: number;
  gender: 'M' | 'F' | 'O';
  mobile: string;
}

interface AbhaCreateResult {
  abhaNumber: string;
  abhaAddress: string;
}

interface AbhaVerifyResult {
  verified: boolean;
  details: Record<string, unknown>;
}

interface LinkResult {
  linked: boolean;
}

const SANDBOX_BASE_URL = 'https://healthidsbx.abdm.gov.in/api';

/**
 * Stub client for ABDM (Ayushman Bharat Digital Mission) integration.
 *
 * Actual ABDM integration requires sandbox registration and approved
 * credentials. This implementation logs calls and returns mock data
 * while preserving the correct request structures and URL patterns.
 */
export class ABDMClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: ABDMConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = config.baseUrl ?? SANDBOX_BASE_URL;
  }

  async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    const url = `${this.baseUrl}/v1/auth/cert`;
    const body = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    };

    console.log('[ABDM] POST', url, JSON.stringify(body, null, 2));

    // Stub: in production, this would be an HTTP POST to the ABDM auth endpoint
    this.cachedToken = `abdm_stub_token_${Date.now()}`;
    this.tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 minutes

    return this.cachedToken;
  }

  async createAbhaId(params: AbhaCreateParams): Promise<AbhaCreateResult> {
    const token = await this.getToken();
    const url = `${this.baseUrl}/v1/registration/aadhaar/createHealthIdWithPreVerified`;
    const body = {
      name: params.name,
      yearOfBirth: params.yearOfBirth,
      gender: params.gender,
      mobile: params.mobile,
    };

    console.log('[ABDM] POST', url);
    console.log('[ABDM] Authorization: Bearer', token.substring(0, 16) + '...');
    console.log('[ABDM] Body:', JSON.stringify(body, null, 2));

    const stubAbhaNumber = `91-${Math.random().toString().slice(2, 6)}-${Math.random().toString().slice(2, 6)}-${Math.random().toString().slice(2, 6)}`;
    const stubAbhaAddress = `${params.name.toLowerCase().replace(/\s+/g, '')}@abdm`;

    return {
      abhaNumber: stubAbhaNumber,
      abhaAddress: stubAbhaAddress,
    };
  }

  async verifyAbhaId(abhaId: string): Promise<AbhaVerifyResult> {
    const token = await this.getToken();
    const url = `${this.baseUrl}/v1/search/searchByHealthId`;
    const body = { healthId: abhaId };

    console.log('[ABDM] POST', url);
    console.log('[ABDM] Authorization: Bearer', token.substring(0, 16) + '...');
    console.log('[ABDM] Body:', JSON.stringify(body, null, 2));

    return {
      verified: true,
      details: {
        healthId: abhaId,
        name: 'Stub User',
        status: 'ACTIVE',
        yearOfBirth: '1990',
        gender: 'M',
      },
    };
  }

  async linkHealthRecord(abhaId: string, record: HealthRecord): Promise<LinkResult> {
    const token = await this.getToken();
    const url = `${this.baseUrl}/v1/links/link/add-contexts`;
    const body = {
      abhaAddress: abhaId,
      patient: { referenceNumber: abhaId, display: 'Patient' },
      hip: { id: record.facilityId, name: 'CaseConnect HIP' },
      careContexts: [
        {
          referenceNumber: record.recordId,
          display: record.recordType,
        },
      ],
    };

    console.log('[ABDM] POST', url);
    console.log('[ABDM] Authorization: Bearer', token.substring(0, 16) + '...');
    console.log('[ABDM] Body:', JSON.stringify(body, null, 2));

    return { linked: true };
  }

  async fetchHealthRecords(abhaId: string, consent: string): Promise<HealthRecord[]> {
    const token = await this.getToken();
    const url = `${this.baseUrl}/v1/health-information/hiu/request`;
    const body = {
      healthInformationUser: { id: 'caseconnect-hiu' },
      consent: { id: consent },
      dateRange: {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      dataPushUrl: `${this.baseUrl}/v1/health-information/transfer`,
    };

    console.log('[ABDM] POST', url);
    console.log('[ABDM] Authorization: Bearer', token.substring(0, 16) + '...');
    console.log('[ABDM] Body:', JSON.stringify(body, null, 2));

    return [
      {
        recordId: `stub-record-${Date.now()}`,
        recordType: 'OPConsultation',
        facilityId: 'caseconnect-facility-001',
        date: new Date().toISOString(),
        data: {
          abhaId,
          consentId: consent,
          diagnosis: 'Stub diagnosis for development',
        },
      },
    ];
  }
}
