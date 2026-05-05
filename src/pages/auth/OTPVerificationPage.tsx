import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export default function OTPVerificationPage() {
  const navigate = useNavigate();
  const { verifyOTP, isLoading, error, clearError, _fpEmail } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    clearError();

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return;
    clearError();
    const success = await verifyOTP(_fpEmail, code);
    if (success) {
      navigate('/reset-password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Verify your email</h2>
        <p className="text-[var(--text-secondary)] mb-8">
          Enter the 6-digit code sent to your email. <span className="text-xs text-[var(--text-tertiary)]">(Use: 123456)</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                whileFocus={{ scale: 1.05 }}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--input-border)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none transition-all"
              />
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800"
            >
              <p className="text-sm text-danger-600 dark:text-danger-400 text-center">{error}</p>
            </motion.div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading} disabled={otp.join('').length !== 6}>
            Verify code
          </Button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Didn't receive the code?{' '}
            <button type="button" className="text-brand-500 hover:text-brand-600 font-medium">
              Resend
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
