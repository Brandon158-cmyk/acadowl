import { mutation, internalMutation, action } from '../_generated/server';
import { v } from 'convex/values';
import { requirePlatformAdmin, requireSchoolAdmin } from '../_lib/permissions';
import { createAccount } from '@convex-dev/auth/server';
import { api, internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

/**
 * School mutation functions.
 */

/** Create a new school (Internal) */
export const createSchoolInternal = internalMutation({
  args: {
    slug: v.string(),
    name: v.string(),
    shortName: v.optional(v.string()),
    type: v.union(
      v.literal('day_primary'),
      v.literal('day_secondary'),
      v.literal('boarding_primary'),
      v.literal('boarding_secondary'),
      v.literal('mixed_secondary'),
      v.literal('college'),
      v.literal('technical'),
    ),
    province: v.string(),
    district: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    moeCode: v.optional(v.string()),
    heaCode: v.optional(v.string()),
    zraTpin: v.string(),
    subscriptionTier: v.union(v.literal('starter'), v.literal('standard'), v.literal('premium')),
    enabledFeatures: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check slug uniqueness
    const existing = await ctx.db
      .query('schools')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (existing) {
      throw new Error('A school with this slug already exists.');
    }

    const now = Date.now();

    // Insert the school
    const schoolId = await ctx.db.insert('schools', {
      ...args,
      gradingMode: args.type === 'college' || args.type === 'technical' ? 'gpa' : 'ecz',
      academicMode: args.type === 'college' || args.type === 'technical' ? 'semester' : 'term',
      branding: {
        primaryColor: '#1a6b3c',
        secondaryColor: '#e5a100',
      },
      smsBalance: 0,
      smsProvider: 'auto',
      siblingDiscountRules: [],
      customStudentFields: [],
      onboardingComplete: false,
      status: 'trial',
      createdAt: now,
      updatedAt: now,
    });

    return schoolId;
  },
});

/** Public Action: Create School + Admin Account */
export const createSchool = action({
  args: {
    slug: v.string(),
    name: v.string(),
    shortName: v.optional(v.string()),
    type: v.union(
      v.literal('day_primary'),
      v.literal('day_secondary'),
      v.literal('boarding_primary'),
      v.literal('boarding_secondary'),
      v.literal('mixed_secondary'),
      v.literal('college'),
      v.literal('technical'),
    ),
    province: v.string(),
    district: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    moeCode: v.optional(v.string()),
    heaCode: v.optional(v.string()),
    zraTpin: v.string(),
    subscriptionTier: v.union(v.literal('starter'), v.literal('standard'), v.literal('premium')),
    enabledFeatures: v.array(v.string()),
    // Admin setup
    adminName: v.string(),
    adminEmail: v.string(),
    adminPassword: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const { adminName, adminEmail, adminPassword, ...schoolData } = args;

    // 1. Create the school record
    const schoolId = (await ctx.runMutation(
      internal.schools.mutations.createSchoolInternal,
      schoolData,
    )) as Id<'schools'>;

    // 2. Create the admin account
    await createAccount(ctx, {
      provider: 'password',
      account: {
        id: adminEmail.toLowerCase(),
        secret: adminPassword,
      },
      profile: {
        name: adminName,
        email: adminEmail.toLowerCase(),
        role: 'school_admin',
        schoolId,
        isActive: true,
        isFirstLogin: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any,
    });

    return schoolId;
  },
});

/** Update school branding (School Admin only) */
export const updateBranding = mutation({
  args: {
    logoUrl: v.optional(v.string()),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    motto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requireSchoolAdmin(ctx);

    await ctx.db.patch(school._id, {
      branding: {
        logoUrl: args.logoUrl,
        primaryColor: args.primaryColor,
        secondaryColor: args.secondaryColor,
        motto: args.motto,
      },
      updatedAt: Date.now(),
    });
  },
});

/** Update enabled features (School Admin only) */
export const updateEnabledFeatures = mutation({
  args: {
    features: v.array(v.string()),
  },
  handler: async (ctx, { features }) => {
    const { school } = await requireSchoolAdmin(ctx);

    await ctx.db.patch(school._id, {
      enabledFeatures: features,
      updatedAt: Date.now(),
    });
  },
});

/** Update custom student fields (School Admin only) */
export const updateCustomStudentFields = mutation({
  args: {
    fields: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        type: v.union(
          v.literal('text'),
          v.literal('select'),
          v.literal('boolean'),
          v.literal('date'),
        ),
        options: v.optional(v.array(v.string())),
        required: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, { fields }) => {
    const { school } = await requireSchoolAdmin(ctx);

    if (fields.length > 20) {
      throw new Error('Maximum 20 custom fields allowed per school.');
    }

    await ctx.db.patch(school._id, {
      customStudentFields: fields,
      updatedAt: Date.now(),
    });
  },
});
