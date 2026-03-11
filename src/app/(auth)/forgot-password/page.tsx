'use client';

import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Trigger a password reset flow with Convex Auth
      // The exact implementation relies on your provider
      await signIn('password', { email, flow: 'reset' });
      setSuccess(true);
      toast.success('Password reset link sent to your email.');
    } catch (err) {
      setError('Something went wrong. Please check your email and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-t-school-primary border-t-4">
      <CardHeader className="text-center">
        <div className="bg-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
          <Mail className="text-primary-foreground h-7 w-7" />
        </div>
        <CardTitle className="text-xl">Reset Password</CardTitle>
        <CardDescription>Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4 text-center">
            <p className="text-sm">
              Check your inbox for a link to reset your password. If it doesn't appear within a few
              minutes, check your spam folder.
            </p>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Return to login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@school.edu.zm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              Send reset link
            </Button>

            <div className="mt-4 flex justify-center text-sm">
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
