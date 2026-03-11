'use client';

import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'next/navigation';

export default function PlatformRegisterPage() {
  const { signIn } = useAuthActions();
  const elevate = useMutation(api.platformAdmin.elevateMyAccount);
  const router = useRouter();

  const [step, setStep] = useState<'secret' | 'details'>('secret');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    adminSecret: '',
    name: '',
    email: '',
    password: '',
  });

  const handleStepSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.adminSecret) return;
    setStep('details');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Perform actual Sign Up to create the account/identity
      await signIn('password', {
        email: form.email,
        password: form.password,
        name: form.name,
        flow: 'signUp',
      });

      // 2. Elevate the identity that was just created/logged in
      const result = await elevate({
        adminSecret: form.adminSecret,
        email: form.email,
      });

      console.log('Elevation result:', result);

      if (result.role !== 'platform_admin') {
        throw new Error(
          `Elevation incomplete. Assigned role: ${result.role || 'none'}. Please try again.`,
        );
      }

      // 3. Redirect to the platform dashboard
      router.push('/platform/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during registration.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Platform Registry</h1>
          <p className="mt-2 text-gray-500">Bootstrap the initial administrator account</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {step === 'secret' ? (
          <form onSubmit={handleStepSecret} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Platform Secret Key
              </label>
              <input
                type="password"
                required
                value={form.adminSecret}
                onChange={(e) => setForm({ ...form, adminSecret: e.target.value })}
                className="focus:ring-maroon-500 w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                placeholder="Enter the system secret..."
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Verify Secret
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="focus:ring-maroon-500 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="focus:ring-maroon-500 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Set Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="focus:ring-maroon-500 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none"
              />
            </div>
            <div className="space-y-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-maroon-700 hover:bg-maroon-800 flex w-full items-center justify-center rounded-lg px-4 py-3 font-semibold text-white transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Creating Account...' : 'Register Administrator'}
              </button>
              <button
                type="button"
                onClick={() => setStep('secret')}
                className="w-full text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                Back to verify secret
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
