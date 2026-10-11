import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Lock, ShieldCheck, User } from 'lucide-react';
import {
  TEST_CREDENTIALS,
  TEST_OTP,
  checkCredentials,
  checkOtp,
  useAuthStore,
} from '@/store/auth';
import { cn } from '@/lib/cn';

interface FromState {
  from?: { pathname?: string };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signIn = useAuthStore((s) => s.signIn);

  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const target = (location.state as FromState | null)?.from?.pathname || '/';

  if (isAuthenticated) return <Navigate to={target} replace />;

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError('');
    setPending(true);
    await wait(450);
    if (checkCredentials(username, password)) {
      setPending(false);
      setStep(2);
    } else {
      setPending(false);
      setError('Invalid username or password. Use the test credentials shown above.');
    }
  }

  async function submitOtp(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError('');
    await wait(400);
    if (checkOtp(otp)) {
      signIn(username.trim());
      navigate(target, { replace: true });
      return;
    }
    setPending(false);
    setError('That code is not valid. Enter the code shown above.');
  }

  function backToCredentials(e?: React.MouseEvent<HTMLButtonElement>) {
    // Guard against the click's default action firing after React reuses this
    // button node for the step-1 submit button (which would resubmit and bounce
    // straight back to the OTP step).
    e?.preventDefault();
    setStep(1);
    setOtp('');
    setError('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            A
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Sign in to AcmeDesk</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Two-step verification · test automation portal
          </p>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center gap-2" data-testid="auth-step" data-step={step}>
            {[1, 2].map((n) => (
              <div key={n} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    step === n
                      ? 'bg-brand-600 text-white'
                      : step > n
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
                  )}
                >
                  {n}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    step === n ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400',
                  )}
                >
                  {n === 1 ? 'Credentials' : 'One-time code'}
                </span>
                {n === 1 && <span className="ms-auto h-px flex-1 bg-slate-200 dark:bg-slate-700" />}
              </div>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              data-testid="auth-error"
              className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          {step === 1 ? (
            <form key="credentials" onSubmit={submitCredentials} className="space-y-4" noValidate>
              <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-xs text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200">
                <p className="font-semibold uppercase tracking-wide">Test credentials</p>
                <p className="mt-1 font-mono">
                  username: <span data-testid="hint-username">{TEST_CREDENTIALS.username}</span>
                </p>
                <p className="font-mono">
                  password: <span data-testid="hint-password">{TEST_CREDENTIALS.password}</span>
                </p>
              </div>

              <div>
                <label className="label" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    className="input ps-9"
                    placeholder={TEST_CREDENTIALS.username}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    data-testid="login-username"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="input ps-9"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="login-password"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={pending} data-testid="login-submit">
                {pending ? 'Checking…' : 'Continue'}
              </button>
            </form>
          ) : (
            <form key="otp" onSubmit={submitOtp} className="space-y-4" noValidate>
              <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-xs text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200">
                <p className="font-semibold uppercase tracking-wide">Test one-time code</p>
                <p className="mt-1 font-mono">
                  code: <span data-testid="hint-otp">{TEST_OTP}</span>
                </p>
              </div>

              <div>
                <label className="label" htmlFor="otp">
                  One-time code
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="otp"
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="input ps-9 font-mono tracking-[0.4em]"
                    placeholder="······"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    data-testid="otp-input"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={pending} data-testid="otp-submit">
                {pending ? 'Verifying…' : 'Verify & sign in'}
              </button>

              <button
                type="button"
                className="btn-ghost w-full"
                onClick={backToCredentials}
                disabled={pending}
                data-testid="auth-back"
              >
                Back
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Demo authentication — no real accounts are used.
        </p>
      </div>
    </div>
  );
}
