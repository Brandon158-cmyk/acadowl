'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetupPage() {
  const router = useRouter();
  const userData = useQuery(api.users.queries.getMe);
  const resolveProfile = useMutation(api.users.mutations.resolveUserProfile);

  const [loading, setLoading] = useState(false);

  if (userData === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If already resolved/setup, go home
  if (userData?.user?.staffId || userData?.user?.guardianId || userData?.user?.studentId) {
    router.push('/dashboard');
    return null;
  }

  const handleResolve = async () => {
    setLoading(true);
    try {
      // The resolve mutation links the auth token to a known staff/guardian row based on email/phone
      const result = await resolveProfile();

      if (result && result.user) {
        toast.success('Welcome back! Your profile was found.');
        router.push('/dashboard');
      } else {
        toast.error('Could not find a matching profile. Please contact your school administrator.');
      }
    } catch (error) {
      toast.error('An error occurred during profile setup.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <Card className="border-t-school-primary w-full max-w-md border-t-4 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Complete Your Setup</CardTitle>
          <CardDescription>We need to link your account to your school profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="bg-primary/10 flex h-24 w-24 animate-pulse items-center justify-center rounded-full">
            <Loader2 className="text-primary h-10 w-10" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium">
              Logged in as: {userData?.user?.email || userData?.user?.phone}
            </p>
            <p className="text-muted-foreground text-sm">
              Click below to find your digital profile in our system.
            </p>
          </div>

          <Button onClick={handleResolve} disabled={loading} className="w-full" size="lg">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Link My Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
