'use client';

import { useState, Suspense } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyOtpView() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn('twilio', { phone, code });
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-t-school-primary border-t-4">
      <CardHeader className="text-center">
        <div className="bg-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
          <KeyRound className="text-primary-foreground h-7 w-7" />
        </div>
        <CardTitle className="text-xl">Verify your identity</CardTitle>
        <CardDescription>Enter the 6-digit code sent to {phone}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={loading}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading || code.length < 5}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Log In
          </Button>

          <div className="mt-4 flex justify-center text-sm">
            <Link href="/login-otp" className="text-muted-foreground hover:text-foreground">
              Try a different number
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <VerifyOtpView />
    </Suspense>
  );
}
