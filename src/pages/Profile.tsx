import { useState, type FormEvent } from 'react';
import {
  Briefcase,
  Building2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  UserRound,
} from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { initialsOf, useAuthStore, type ProfileFields } from '@/store/auth';
import { toast } from '@/store/toast';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function Profile() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [form, setForm] = useState<ProfileFields>(() => ({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    jobTitle: user?.jobTitle ?? '',
    department: user?.department ?? '',
    location: user?.location ?? '',
    bio: user?.bio ?? '',
  }));
  const [error, setError] = useState('');

  function update<K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm({
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      jobTitle: user?.jobTitle ?? '',
      department: user?.department ?? '',
      location: user?.location ?? '',
      bio: user?.bio ?? '',
    });
    setError('');
    toast.info('Changes discarded');
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError('A valid email address is required.');
      return;
    }
    setError('');
    updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      jobTitle: form.jobTitle.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      bio: form.bio.trim(),
    });
    toast.success('Profile saved');
  }

  if (!user) return null;

  const displayName = form.name.trim() || user.username;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-semibold" data-testid="page-title">
        Profile
      </h1>

      <section className="card mb-4 flex items-center gap-4 p-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
          {initialsOf(displayName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold" data-testid="profile-display-name">
            {displayName}
          </p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            @<span data-testid="profile-username">{user.username}</span>
          </p>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <UserRound className="h-4 w-4" /> Personal details
        </h2>

        {error && (
          <div
            role="alert"
            data-testid="profile-error"
            className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Full name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="name"
                  name="name"
                  className="input ps-9"
                  placeholder="e.g. Ada Lovelace"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  data-testid="profile-name"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="email">
                Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="input ps-9"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  data-testid="profile-email"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="phone">
                Phone
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="input ps-9"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  data-testid="profile-phone"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="jobTitle">
                Job title
              </label>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="jobTitle"
                  name="jobTitle"
                  className="input ps-9"
                  placeholder="e.g. Support Lead"
                  value={form.jobTitle}
                  onChange={(e) => update('jobTitle', e.target.value)}
                  data-testid="profile-job-title"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="department">
                Department
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="department"
                  name="department"
                  className="input ps-9"
                  placeholder="e.g. Customer Support"
                  value={form.department}
                  onChange={(e) => update('department', e.target.value)}
                  data-testid="profile-department"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="location">
                Location
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="location"
                  name="location"
                  className="input ps-9"
                  placeholder="e.g. Berlin, DE"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  data-testid="profile-location"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="bio">
              Bio
            </label>
            <RichTextEditor
              testId="profile-bio"
              value={form.bio}
              onChange={(html) => update('bio', html)}
              placeholder="A short note about you…"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={reset} data-testid="profile-reset">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button type="submit" className="btn-primary" data-testid="profile-save">
              <Save className="h-4 w-4" /> Save changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
