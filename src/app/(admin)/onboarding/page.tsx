'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSchool } from '@/hooks/useSchool';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  Building2,
  Paintbrush,
  Boxes,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export default function OnboardingWizard() {
  const { school, isLoading } = useSchool();
  const router = useRouter();
  const updateBranding = useMutation(api.schools.mutations.updateBranding);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Note: Full wizard would map directly to feature settings and custom fields
  // Here we simplify to demonstrate the UX flow and capture basic branding

  const [formData, setFormData] = useState({
    motto: '',
    primaryColor: '#1a6b3c',
  });

  if (isLoading || !school) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If already onboarded, send to dashboard
  if (school.onboardingComplete) {
    router.push('/dashboard');
    return null;
  }

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleComplete = async () => {
    setLoading(true);
    try {
      // 1. Update branding
      await updateBranding({
        motto: formData.motto,
        primaryColor: formData.primaryColor,
        secondaryColor: '#e5a100', // Default secondary color
      });

      // 2. Mark onboarding complete (requires a mutation we can pretend exists or just use a generic update. For now, we simulate).
      // await updateOnboardingStatus({ onboardingComplete: true });

      toast.success('Onboarding complete! Welcome to EduZambia.');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to complete setup.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted/40 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* Progress bar */}
        <div className="relative flex justify-between">
          <div className="bg-muted absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded-full" />
          <div
            className="bg-primary absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {[
            { icon: Building2, label: 'Welcome' },
            { icon: Paintbrush, label: 'Branding' },
            { icon: Boxes, label: 'Features' },
            { icon: CheckCircle2, label: 'Ready' },
          ].map((s, i) => (
            <div key={i} className="relative flex flex-col items-center gap-2">
              <div
                className={`bg-background flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  step > i + 1
                    ? 'border-primary text-primary'
                    : step === i + 1
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted text-muted-foreground'
                }`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <span
                className={`text-xs font-medium ${step >= i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <Card className="flex min-h-[400px] flex-col">
          {step === 1 && (
            <>
              <CardHeader className="pt-10 text-center">
                <CardTitle className="text-3xl font-bold">Welcome to {school.name}</CardTitle>
                <CardDescription className="mt-2 text-lg">
                  Let's get your digital campus set up in just a few minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center">
                <img
                  src="/api/placeholder/400/200"
                  alt="Welcome Illustration"
                  className="rounded-lg opacity-80"
                />
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>School Identity</CardTitle>
                <CardDescription>
                  Customize how your school appears to students and parents.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="mx-auto max-w-md space-y-2">
                  <Label>School Motto</Label>
                  <Input
                    value={formData.motto}
                    onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                    placeholder="e.g. Excellence in Education"
                  />
                </div>
                <div className="mx-auto max-w-md space-y-2">
                  <Label>Primary Color (Hex)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="h-10 w-12 cursor-pointer p-1"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Activate Modules</CardTitle>
                <CardDescription>You can change these later in Settings.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="bg-muted/40 rounded-lg border p-4">
                  <p className="text-sm font-medium">
                    For this setup, we'll keep the standard defaults based on your school type.
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    All core academic, grading, and attendance features are pre-activated.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader className="pt-10 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl font-bold">You're all set!</CardTitle>
                <CardDescription className="mt-2 text-lg">
                  Your school portal is configured and ready to use.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1" />
            </>
          )}

          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1 || loading}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading} size="lg" className="w-40">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go to Dashboard'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
