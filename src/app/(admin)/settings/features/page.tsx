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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { isCoreFeature, Feature } from '@/lib/features/flags';
import { FEATURE_GROUPS } from '@/lib/features/presets';
import { Feature as FeatureEnum } from '@/lib/features/flags';

export default function FeatureManagementPage() {
  const { school, features, isLoading: isSchoolLoading } = useSchool();
  const updateFeatures = useMutation(api.schools.mutations.updateEnabledFeatures);

  const [loading, setLoading] = useState(false);
  const [activeFeatures, setActiveFeatures] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (features) {
      setActiveFeatures(new Set(features as string[]));
    }
  }, [features]);

  if (isSchoolLoading || !school) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleToggle = (feature: string, enabled: boolean) => {
    if (isCoreFeature(feature as FeatureEnum)) return; // Prevents changing core features

    const newFeatures = new Set(activeFeatures);
    if (enabled) {
      newFeatures.add(feature);
    } else {
      newFeatures.delete(feature);
    }
    setActiveFeatures(newFeatures);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateFeatures({
        features: Array.from(activeFeatures),
      });
      toast.success('Features updated successfully. Navigation and UI will adapt.');
    } catch (error) {
      toast.error('Failed to update features.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature Management"
        description="Enable or disable optional modules for your school. Changing these settings will immediately adapt the portal's navigation and capabilities."
      />

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {FEATURE_GROUPS.map((group) => (
          <Card key={group.group}>
            <CardHeader>
              <CardTitle className="text-lg">{group.group}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {group.features.map((f) => {
                const isActive = activeFeatures.has(f.feature);
                const isCore = isCoreFeature(f.feature as FeatureEnum);

                return (
                  <div
                    key={f.feature}
                    className={`flex items-start space-x-3 rounded-lg border p-4 ${
                      isActive ? 'bg-muted/30 border-primary/20' : 'bg-card'
                    }`}
                  >
                    <Switch
                      id={f.feature}
                      checked={isActive}
                      onCheckedChange={(checked) => handleToggle(f.feature, checked)}
                      disabled={isCore || loading}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor={f.feature} className="cursor-pointer text-base font-medium">
                        {f.label}
                        {isCore && (
                          <span className="text-muted-foreground ml-2 text-xs font-normal">
                            (Core)
                          </span>
                        )}
                      </Label>
                      <p className="text-muted-foreground text-sm">{f.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} size="lg">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Feature Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
