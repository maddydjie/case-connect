import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface PrescriptionDrugRow {
  genericNameCaps: string;
  dosageForm: string;
  strength: string;
  route: string;
  frequency: string;
  duration: string;
  totalQuantity: string;
}

export interface PrescriptionPdfProps {
  doctorName: string;
  qualifications: string;
  nmcRegistration: string;
  hospitalName: string;
  hospitalAddress: string;
  patientName: string;
  age: string;
  gender: string;
  weightKg: string;
  address: string;
  date: string;
  diagnosisIcd: string[];
  drugs: PrescriptionDrugRow[];
  refillNote: string;
  signatureLine: string;
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#15803d', paddingBottom: 8 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#14532d' },
  sub: { fontSize: 9, color: '#444', marginTop: 2 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 90, fontWeight: 'bold', color: '#333' },
  value: { flex: 1, color: '#111' },
  section: { marginTop: 10, marginBottom: 6 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', backgroundColor: '#f0fdf4', padding: 4, marginBottom: 6 },
  drugBlock: { marginBottom: 8, padding: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  drugName: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  rx: { fontSize: 9, color: '#374151' },
  footer: { marginTop: 20, fontSize: 8, color: '#6b7280' },
  sign: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 4, width: 200 },
});

export function PrescriptionPdfDocument(props: PrescriptionPdfProps) {
  const {
    doctorName,
    qualifications,
    nmcRegistration,
    hospitalName,
    hospitalAddress,
    patientName,
    age,
    gender,
    weightKg,
    address,
    date,
    diagnosisIcd,
    drugs,
    refillNote,
    signatureLine,
  } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{hospitalName}</Text>
          <Text style={styles.sub}>{hospitalAddress}</Text>
          <Text style={[styles.sub, { marginTop: 6 }]}>
            Prescribing Doctor: {doctorName} ({qualifications})
          </Text>
          <Text style={styles.sub}>NMC Registration No: {nmcRegistration}</Text>
        </View>

        <Text style={styles.sectionTitle}>Patient particulars (NMC format)</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{patientName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Age / Sex</Text>
          <Text style={styles.value}>
            {age} / {gender}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Weight</Text>
          <Text style={styles.value}>{weightKg} kg</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{date}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provisional diagnosis (ICD-10-CM)</Text>
          {diagnosisIcd.map((d, i) => (
            <Text key={i} style={styles.rx}>
              • {d}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicines (GENERIC NAME IN CAPITAL LETTERS)</Text>
          {drugs.map((d, i) => (
            <View key={i} style={styles.drugBlock} wrap={false}>
              <Text style={styles.drugName}>{d.genericNameCaps}</Text>
              <Text style={styles.rx}>
                Form: {d.dosageForm} | Strength: {d.strength} | Route: {d.route}
              </Text>
              <Text style={styles.rx}>
                Frequency: {d.frequency} | Duration: {d.duration} | Qty: {d.totalQuantity}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.rx}>Refill: {refillNote}</Text>
        <Text style={[styles.footer, { marginTop: 8 }]}>
          Habit-forming medicines (if any) must be written separately and signed in original as per
          NMC norms.
        </Text>

        <View style={styles.sign}>
          <Text style={styles.rx}>{signatureLine}</Text>
        </View>
      </Page>
    </Document>
  );
}
