'use client';

import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { getDefaultFeaturesForSchoolType } from '@/lib/features/presets';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * ISSUE-017 · Create School Wizard
 * Platform Admin onboarding for new schools.
 */

const formSchema = z.object({
  name: z.string().min(2, 'School name is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  shortName: z.string().optional(),
  type: z.enum([
    'day_primary',
    'day_secondary',
    'boarding_primary',
    'boarding_secondary',
    'mixed_secondary',
    'college',
    'technical',
  ]),
  province: z.string().min(2, 'Province is required'),
  district: z.string().min(2, 'District is required'),
  address: z.string().min(2, 'Address is required'),
  phone: z.string().min(8, 'Valid phone number required'),
  zraTpin: z.string().min(10, 'ZRA TPIN requires at least 10 digits'),
  subscriptionTier: z.enum(['starter', 'standard', 'premium']),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateSchoolPage() {
  const router = useRouter();
  const createSchool = useMutation(api.schools.mutations.createSchool);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'day_secondary',
      subscriptionTier: 'starter',
      slug: '',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields, isSubmitting },
    setValue,
  } = form;

  // Auto-generate slug from name if empty
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('name', e.target.value);
    if (!dirtyFields.slug) {
      const suggestedSlug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', suggestedSlug, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const enabledFeatures = getDefaultFeaturesForSchoolType(values.type);

      await createSchool({
        ...values,
        enabledFeatures,
      });

      toast.success('School created successfully');
      router.push('/platform/schools'); // Or to user creation for this school
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create school');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <PageHeader
        title="Create New School"
        description="Onboard a new institution to the EduZambia platform."
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">School Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Kabulonga Boys Secondary"
                  {...register('name')}
                  onChange={handleNameChange}
                />
                {errors.name && (
                  <p className="text-destructive text-[0.8rem] font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Subdomain Slug</Label>
                <div className="flex">
                  <Input id="slug" className="rounded-r-none" {...register('slug')} />
                  <div className="bg-muted text-muted-foreground flex items-center rounded-r-md border border-l-0 px-3 text-sm">
                    .eduzambia.zm
                  </div>
                </div>
                {errors.slug && (
                  <p className="text-destructive text-[0.8rem] font-medium">
                    {errors.slug.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>School Type</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day_primary">Day Primary</SelectItem>
                        <SelectItem value="day_secondary">Day Secondary</SelectItem>
                        <SelectItem value="boarding_primary">Boarding Primary</SelectItem>
                        <SelectItem value="boarding_secondary">Boarding Secondary</SelectItem>
                        <SelectItem value="mixed_secondary">Mixed Secondary</SelectItem>
                        <SelectItem value="college">College</SelectItem>
                        <SelectItem value="technical">Technical / Trade</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-destructive text-[0.8rem] font-medium">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Controller
                  control={control}
                  name="subscriptionTier"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.subscriptionTier && (
                  <p className="text-destructive text-[0.8rem] font-medium">
                    {errors.subscriptionTier.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input id="province" placeholder="Lusaka" {...register('province')} />
                {errors.province && (
                  <p className="text-destructive text-[0.8rem] font-medium">
                    {errors.province.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input id="district" placeholder="Lusaka" {...register('district')} />
                {errors.district && (
                  <p className="text-destructive text-[0.8rem] font-medium">
                    {errors.district.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Input id="address" placeholder="123 Independence Ave" {...register('address')} />
              {errors.address && (
                <p className="text-destructive text-[0.8rem] font-medium">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input id="phone" placeholder="+260..." {...register('phone')} />
                {errors.phone && (
                  <p className="text-destructive text-[0.8rem] font-medium">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zraTpin">ZRA TPIN</Label>
                <Input id="zraTpin" placeholder="100..." {...register('zraTpin')} />
                {errors.zraTpin && (
                  <p className="text-destructive text-[0.8rem] font-medium">
                    {errors.zraTpin.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create School'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
