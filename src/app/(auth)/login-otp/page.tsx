'use client';

import { useState, useEffect } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { GraduationCap, Loader2, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginOtpPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Automatic redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convex Auth custom OTP provider integration
      // Needs backend configuration with Twilio/equivalent
      await signIn('twilio', { phone });

      // Store phone in session or URL encode for verify page
      router.push(`/login-otp/verify?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setError('Failed to send OTP. Please check your number.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-t-school-primary border-t-4">
      <CardHeader className="text-center">
        <div className="bg-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
          <Phone className="text-primary-foreground h-7 w-7" />
        </div>
        <CardTitle className="text-xl">Login with Phone</CardTitle>
        <CardDescription>We'll send a code to your mobile number</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+260 97 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send verification code
          </Button>

          <div className="mt-4 flex justify-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Back to email login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
