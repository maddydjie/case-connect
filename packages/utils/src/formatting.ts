export function formatPatientName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function formatBedNumber(floor: number, ward: string, bedNumber: string): string {
  return `F${floor}-${ward}-${bedNumber}`;
}

export function formatBloodPressure(systolic?: number, diastolic?: number): string {
  if (!systolic || !diastolic) return 'N/A';
  return `${systolic}/${diastolic} mmHg`;
}

export function formatVitals(vitals: Record<string, number | undefined>): Record<string, string> {
  const formatted: Record<string, string> = {};
  if (vitals.temperature) formatted.temperature = `${vitals.temperature}°F`;
  if (vitals.pulse) formatted.pulse = `${vitals.pulse} bpm`;
  if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic)
    formatted.bloodPressure = formatBloodPressure(vitals.bloodPressureSystolic, vitals.bloodPressureDiastolic);
  if (vitals.respiratoryRate) formatted.respiratoryRate = `${vitals.respiratoryRate}/min`;
  if (vitals.spo2) formatted.spo2 = `${vitals.spo2}%`;
  if (vitals.weight) formatted.weight = `${vitals.weight} kg`;
  if (vitals.height) formatted.height = `${vitals.height} cm`;
  return formatted;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function maskAbhaId(abhaId: string): string {
  if (abhaId.length !== 14) return abhaId;
  return `${abhaId.slice(0, 4)}-XXXX-XXXX-${abhaId.slice(10)}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  return `XXXXXX${digits.slice(-4)}`;
}

export function generateMRN(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MRN-${timestamp}-${random}`;
}
