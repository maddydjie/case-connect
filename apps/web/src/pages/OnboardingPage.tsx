import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
  Building2,
  Phone,
  User,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';

const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'General Medicine',
  'Pulmonology',
  'Dermatology',
  'Pediatrics',
  'Gynecology',
  'Gastroenterology',
  'Ophthalmology',
  'ENT',
  'Psychiatry',
  'Surgery',
  'Radiology',
  'Anesthesiology',
  'Emergency Medicine',
];

const ROLE_CONFIG = {
  doctor: {
    icon: Stethoscope,
    title: 'Doctor',
    color: 'from-emerald-500 to-teal-600',
    fields: ['name', 'phone', 'specialization', 'hospital', 'nmcRegistration'] as const,
  },
  student: {
    icon: GraduationCap,
    title: 'Medical Student',
    color: 'from-blue-500 to-indigo-600',
    fields: ['name', 'phone', 'specialization', 'hospital'] as const,
  },
  patient: {
    icon: HeartPulse,
    title: 'Patient',
    color: 'from-rose-500 to-pink-600',
    fields: ['name', 'phone'] as const,
  },
  admin: {
    icon: ShieldCheck,
    title: 'Administrator',
    color: 'from-violet-500 to-purple-600',
    fields: ['name', 'phone', 'hospital'] as const,
  },
  hms_staff: {
    icon: Building2,
    title: 'HMS Staff',
    color: 'from-amber-500 to-orange-600',
    fields: ['name', 'phone', 'hospital'] as const,
  },
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const role = user?.role ?? 'doctor';
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [hospital, setHospital] = useState('');
  const [nmcRegistration, setNmcRegistration] = useState('');
  const [saving, setSaving] = useState(false);

  const fields = config.fields;
  const totalSteps = fields.length;

  const currentField = fields[step];

  const isFieldValid = () => {
    switch (currentField) {
      case 'name': return name.trim().length >= 2;
      case 'phone': return phone.trim().length >= 10;
      case 'specialization': return specialization.length > 0;
      case 'hospital': return hospital.trim().length >= 2;
      case 'nmcRegistration': return nmcRegistration.trim().length >= 4;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (!isFieldValid()) {
      toast.error('Please fill in this field correctly');
      return;
    }

    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 800));
      completeOnboarding({ name, phone, specialization, hospital, nmcRegistration });
      toast.success('Profile complete! Welcome to CaseConnect.');
      navigate('/');
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const renderField = () => {
    const inputBase = 'w-full rounded-2xl border-2 border-gray-200/80 bg-white/90 px-5 py-4 text-lg font-medium text-gray-900 outline-none transition-all duration-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300';

    switch (currentField) {
      case 'name':
        return (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Rajesh Sharma"
                className={`${inputBase} pl-12`}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">This name will appear on case sheets and prescriptions</p>
          </div>
        );
      case 'phone':
        return (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={`${inputBase} pl-12`}
                type="tel"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">For emergency alerts and WhatsApp reminders</p>
          </div>
        );
      case 'specialization':
        return (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">Specialization</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SPECIALIZATIONS.map((s) => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSpecialization(s)}
                  className={`rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    specialization === s
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'border border-gray-200/80 bg-white/80 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        );
      case 'hospital':
        return (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">Hospital / Institution</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="CaseConnect Multi-Specialty Hospital"
                className={`${inputBase} pl-12`}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>
          </div>
        );
      case 'nmcRegistration':
        return (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">NMC Registration Number</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={nmcRegistration}
                onChange={(e) => setNmcRegistration(e.target.value)}
                placeholder="NMC-123456"
                className={`${inputBase} pl-12`}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">Required for NMC-compliant prescriptions</p>
          </div>
        );
      default:
        return null;
    }
  };

  const fieldLabels: Record<string, string> = {
    name: 'Full Name',
    phone: 'Phone',
    specialization: 'Specialization',
    hospital: 'Hospital',
    nmcRegistration: 'NMC Reg.',
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 25%, #f0fdf9 50%, #f5f3ff 75%, #fdf4ff 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${config.color} shadow-xl`}
          >
            <Icon className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {config.title}!
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Let&apos;s set up your profile to get started
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-1.5">
          {fields.map((f, i) => (
            <div key={f} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${
                i < step ? 'bg-emerald-500' : i === step ? 'bg-emerald-400' : 'bg-gray-200'
              }`} />
              <p className={`mt-1 text-center text-[9px] font-semibold uppercase tracking-wider ${
                i <= step ? 'text-emerald-600' : 'text-gray-300'
              }`}>
                {fieldLabels[f]}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-8 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {renderField()}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 disabled:opacity-0"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={saving}
              className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${config.color} px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-70`}
            >
              {saving ? (
                <>
                  <motion.div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Setting up...
                </>
              ) : step === totalSteps - 1 ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Progress summary */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {fields.map((f, i) => (
            <div
              key={f}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                i < step
                  ? 'bg-emerald-50 text-emerald-700'
                  : i === step
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-300'
              }`}
            >
              {i < step && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
              {fieldLabels[f]}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
