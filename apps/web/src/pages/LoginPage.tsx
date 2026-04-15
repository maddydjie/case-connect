import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Mic,
  BedDouble,
  GraduationCap,
  UserRound,
  BookOpen,
  ShieldCheck,
  HeartPulse,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';

const roles = [
  { key: 'doctor', label: 'Doctor', icon: Stethoscope },
  { key: 'student', label: 'Student', icon: BookOpen },
  { key: 'admin', label: 'Admin', icon: ShieldCheck },
  { key: 'patient', label: 'Patient', icon: HeartPulse },
] as const;

type RoleKey = (typeof roles)[number]['key'];

const featureCards = [
  {
    icon: Mic,
    title: 'Voice-First Documentation',
    description: 'Speak naturally, get structured case sheets',
    delay: 0.3,
  },
  {
    icon: BedDouble,
    title: 'LiveBedMap',
    description: 'Real-time hospital bed management',
    delay: 0.5,
  },
  {
    icon: GraduationCap,
    title: 'AI Case Tutor',
    description: '10,000+ cases for medical students',
    delay: 0.7,
  },
];

const stats = [
  { value: '1.2M+', label: 'Doctors' },
  { value: '600K+', label: 'Students' },
  { value: '150K+', label: 'Hospitals' },
];

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function GridPattern() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.03]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

function FloatingDots() {
  const dots = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full bg-white/10"
          style={{
            width: dot.size,
            height: dot.size,
            left: `${dot.x}%`,
            top: `${dot.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            delay: dot.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>('doctor');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0],
        role: selectedRole as 'doctor' | 'student' | 'patient' | 'admin',
      };
      const mockToken = `cc_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      await new Promise((r) => setTimeout(r, 800));
      login(mockUser, mockToken);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const emailHasValue = email.length > 0;
  const passwordHasValue = password.length > 0;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Branding Panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
        style={{
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 30%, #065f46 50%, #047857 75%, #0d9488 100%)',
        }}
      >
        <GridPattern />
        <FloatingDots />

        {/* Decorative radial glow circles */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-teal-400/8 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-emerald-400/5 blur-2xl" />

        {/* Decorative floating circles */}
        <div className="pointer-events-none absolute right-16 top-24 h-20 w-20 rounded-full border border-white/[0.06] bg-white/[0.02]" />
        <div className="pointer-events-none absolute left-24 bottom-48 h-14 w-14 rounded-full border border-emerald-400/[0.08] bg-emerald-400/[0.03]" />
        <div className="pointer-events-none absolute right-32 bottom-32 h-8 w-8 rounded-full bg-teal-300/[0.06]" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            variants={fadeInLeft}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 ring-1 ring-white/20">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">CaseConnect</span>
          </motion.div>

          {/* Hero Content */}
          <div className="my-auto space-y-8 py-12">
            <motion.h1
              className="text-4xl font-bold leading-[1.15] tracking-tight text-white xl:text-5xl"
              variants={fadeInLeft}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Transform Clinical
              <br />
              Documentation
              <br />
              with{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                Voice AI
              </span>
            </motion.h1>

            <motion.p
              className="max-w-md text-lg leading-relaxed text-emerald-200/80"
              variants={fadeInLeft}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              67% reduction in documentation time.
              <br />
              99.8% medical terminology accuracy.
            </motion.p>

            {/* Feature Cards */}
            <div className="space-y-3 pt-2">
              {featureCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.08] hover:shadow-lg hover:shadow-emerald-900/20"
                  variants={fadeInLeft}
                  initial="hidden"
                  animate="visible"
                  custom={i + 3}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/25 to-teal-500/25 text-emerald-300 ring-1 ring-emerald-400/20 transition-all duration-300 group-hover:from-emerald-400/35 group-hover:to-teal-500/35 group-hover:text-emerald-200 group-hover:ring-emerald-400/30 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{card.title}</p>
                    <p className="text-sm text-emerald-300/60">{card.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Stats & Copyright */}
          <div className="space-y-5">
            <motion.div
              className="flex items-center gap-0 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md overflow-hidden"
              variants={fadeInLeft}
              initial="hidden"
              animate="visible"
              custom={7}
            >
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex-1 relative px-6 py-4 text-center">
                  {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-white/[0.08]" />}
                  <p className="text-xl font-bold bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/50 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            <motion.p
              className="text-sm text-emerald-400/40"
              variants={fadeInLeft}
              initial="hidden"
              animate="visible"
              custom={8}
            >
              &copy; {new Date().getFullYear()} CaseConnect. All rights reserved.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <motion.div
        className="flex w-full flex-col items-center justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fffe 40%, #f0fdf9 100%)',
        }}
        variants={fadeInRight}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <motion.div
            className="mb-10 flex items-center gap-3 lg:hidden"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-600/20">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">CaseConnect</span>
          </motion.div>

          {/* Heading */}
          <motion.div className="mb-8" variants={fadeInUp} initial="hidden" animate="visible" custom={1}>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back <span className="inline-block origin-[70%_70%] animate-[wave_2.5s_ease-in-out_infinite]">👋</span>
            </h1>
            <p className="mt-2 text-base text-gray-500">Sign in to continue to CaseConnect</p>
          </motion.div>

          {/* Role Selector */}
          <motion.div
            className="mb-7"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <div className="flex rounded-2xl bg-gray-100/80 p-1.5 ring-1 ring-gray-200/50">
              {roles.map((role) => {
                const isActive = selectedRole === role.key;
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/30'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                    }`}
                  >
                    <role.icon className="h-3.5 w-3.5" />
                    <span className="hidden min-[400px]:inline">{role.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.form
            className="space-y-5"
            onSubmit={handleSubmit}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            {/* Email Input */}
            <div className="relative group">
              <div className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${emailFocused ? 'text-emerald-500' : 'text-gray-400'}`}>
                <Mail className="h-[18px] w-[18px]" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                className={`peer w-full rounded-xl border bg-white/90 backdrop-blur-sm py-3.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-transparent ${
                  emailFocused
                    ? 'border-emerald-400 ring-4 ring-emerald-500/10 shadow-sm shadow-emerald-500/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Email address"
              />
              <label
                htmlFor="email"
                className={`pointer-events-none absolute left-11 transition-all duration-300 ${
                  emailFocused || emailHasValue
                    ? '-top-2.5 bg-gradient-to-r from-white to-white px-1.5 text-xs font-semibold text-emerald-600'
                    : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                }`}
              >
                Email address
              </label>
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${passwordFocused ? 'text-emerald-500' : 'text-gray-400'}`}>
                <Lock className="h-[18px] w-[18px]" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className={`peer w-full rounded-xl border bg-white/90 backdrop-blur-sm py-3.5 pl-11 pr-12 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-transparent ${
                  passwordFocused
                    ? 'border-emerald-400 ring-4 ring-emerald-500/10 shadow-sm shadow-emerald-500/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Password"
              />
              <label
                htmlFor="password"
                className={`pointer-events-none absolute left-11 transition-all duration-300 ${
                  passwordFocused || passwordHasValue
                    ? '-top-2.5 bg-gradient-to-r from-white to-white px-1.5 text-xs font-semibold text-emerald-600'
                    : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                }`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2.5 select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">Remember this device</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info('Password reset link sent to your email')}
                className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full hover:translate-x-full transition-transform duration-700" />
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <UserRound className="h-4 w-4" />
                  Sign In
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Divider */}
          <motion.div
            className="my-7 flex items-center gap-4"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-xs font-medium text-gray-400">or continue with</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </motion.div>

          {/* Social Buttons */}
          <motion.div
            className="space-y-3"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <button
              type="button"
              onClick={() => toast.info('Google SSO integration coming soon')}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-white hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 text-[11px] font-bold text-white">
                G
              </span>
              Sign in with Google
            </button>

            <button
              type="button"
              onClick={() => toast.info('ABHA ID integration via ABDM APIs coming soon')}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm py-3 text-sm font-medium text-blue-700 transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
            >
              <ShieldCheck className="h-[18px] w-[18px] text-blue-600" />
              Sign in with ABHA ID
            </button>
          </motion.div>

          {/* Bottom Link */}
          <motion.p
            className="mt-8 text-center text-sm text-gray-500"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={6}
          >
            New to CaseConnect?{' '}
            <button
              type="button"
              onClick={() => toast.info('Access request submitted. Our team will reach out within 24 hours.')}
              className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent transition-opacity hover:opacity-80"
            >
              Request access
            </button>
          </motion.p>
        </div>
      </motion.div>

      {/* Keyframe for wave animation */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-8deg); }
          40% { transform: rotate(14deg); }
          50% { transform: rotate(-4deg); }
          60% { transform: rotate(10deg); }
          70% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
