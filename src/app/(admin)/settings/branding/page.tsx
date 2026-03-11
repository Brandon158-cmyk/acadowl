'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useSchool } from '@/hooks/useSchool';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function BrandingSettingsPage() {
  const { school, branding, isLoading: isSchoolLoading } = useSchool();
  const updateBranding = useMutation(api.schools.mutations.updateBranding);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    logoUrl: '',
    primaryColor: '#1a6b3c',
    secondaryColor: '#e5a100',
    motto: '',
  });

  useEffect(() => {
    if (branding) {
      setFormData({
        logoUrl: branding.logoUrl || '',
        primaryColor: branding.primaryColor || '#1a6b3c',
        secondaryColor: branding.secondaryColor || '#e5a100',
        motto: branding.motto || '',
      });
    }
  }, [branding]);

  if (isSchoolLoading || !school) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateBranding({
        logoUrl: formData.logoUrl || undefined,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        motto: formData.motto || undefined,
      });
      toast.success('Branding updated successfully. The UI will adapt shortly.');
    } catch (error) {
      toast.error('Failed to update branding settings.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Branding"
        description="Customize the colors and logo used throughout the portal, invoices, and report cards."
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Branding Settings</CardTitle>
            <CardDescription>Adjust the visual identity for {school.name}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (temporary text input)</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              {formData.logoUrl && (
                <div className="mt-2 inline-block rounded-md border bg-white p-2">
                  <img src={formData.logoUrl} alt="Logo Preview" className="h-16 object-contain" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color (Hex)</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColorPicker"
                    type="color"
                    className="h-10 w-12 cursor-pointer p-1"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                  <Input
                    id="primaryColor"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color (Hex)</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColorPicker"
                    type="color"
                    className="h-10 w-12 cursor-pointer p-1"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  />
                  <Input
                    id="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motto">School Motto</Label>
              <Input
                id="motto"
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                placeholder="e.g. Excellence in Education"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
