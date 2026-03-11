import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * ISSUE-010 · Seed Script for Dev Data
 * Populates Convex with initial demo data:
 * - 1 Platform Admin user
 * - 3 Sample Schools
 * - Academic Years, Terms, and base structure for schools
 */
export const seedDefaults = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, { force }) => {
    // Basic guard
    const existingSchools = await ctx.db.query('schools').take(1);
    if (existingSchools.length > 0 && !force) {
      return {
        status: 'skipped',
        message: 'Schools already exist in database. Use force=true to seed anyway.',
      };
    }

    // 1. Create a Primary School
    const primaryId = await ctx.db.insert('schools', {
      name: 'Lukundo Primary School',
      slug: 'lukundo-primary',
      type: 'day_primary',
      province: 'Lusaka',
      district: 'Lusaka',
      zraTpin: '1000200030',
      address: '123 Baobab Way, Lusaka',
      phone: '+260 97 111 2222',
      email: 'admin@lukundo.edu.zm',
      academicMode: 'term',
      gradingMode: 'percentage',
      status: 'active',
      subscriptionTier: 'standard',
      smsBalance: 500,
      smsProvider: 'auto',
      enabledFeatures: ['attendance', 'exams', 'report_cards'],
      branding: {
        primaryColor: '#0f766e', // Teal
        secondaryColor: '#f59e0b', // Amber
        motto: 'Education is the key',
      },
      siblingDiscountRules: [],
      customStudentFields: [],
      onboardingComplete: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 2. Create a Secondary School
    const secondaryId = await ctx.db.insert('schools', {
      name: 'Kafue High School',
      slug: 'kafue-high',
      type: 'day_secondary',
      province: 'Lusaka',
      district: 'Kafue',
      zraTpin: '1000200031',
      address: '45 River Road, Kafue',
      phone: '+260 97 333 4444',
      email: 'info@kafuehigh.edu.zm',
      academicMode: 'term',
      gradingMode: 'ecz',
      status: 'active',
      subscriptionTier: 'premium',
      smsBalance: 1200,
      smsProvider: 'mtn',
      enabledFeatures: ['attendance', 'exams', 'report_cards', 'boarding', 'library', 'lms'],
      branding: {
        primaryColor: '#b91c1c', // Red
        secondaryColor: '#1d4ed8', // Blue
        motto: 'Striving for Excellence',
      },
      siblingDiscountRules: [],
      customStudentFields: [],
      onboardingComplete: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 3. Create a Combined School
    const combinedId = await ctx.db.insert('schools', {
      name: 'Zambezi International',
      slug: 'zambezi-intl',
      type: 'mixed_secondary',
      province: 'Southern',
      district: 'Livingstone',
      zraTpin: '1000200032',
      address: '77 Airport Rd, Livingstone',
      phone: '+260 97 555 6666',
      email: 'contact@zambeziintl.com',
      academicMode: 'semester',
      gradingMode: 'gpa',
      status: 'active',
      subscriptionTier: 'premium',
      smsBalance: 2000,
      smsProvider: 'auto',
      enabledFeatures: ['attendance', 'exams', 'report_cards', 'transport', 'fees'],
      branding: {
        primaryColor: '#4338ca', // Indigo
        secondaryColor: '#f43f5e', // Rose
        motto: 'Global Citizens, Local Roots',
      },
      siblingDiscountRules: [],
      customStudentFields: [],
      onboardingComplete: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 4. Create Academic Years & Terms for the Primary School
    const yearId = await ctx.db.insert('academicYears', {
      schoolId: primaryId,
      year: new Date().getFullYear(),
      label: `${new Date().getFullYear()} Academic Year`,
      startDate: `${new Date().getFullYear()}-01-15`,
      endDate: `${new Date().getFullYear()}-12-05`,
      isActive: true,
      createdAt: Date.now(),
    });

    // Set school pointer
    await ctx.db.patch(primaryId, {
      currentAcademicYearId: yearId,
    });

    const term1Id = await ctx.db.insert('terms', {
      schoolId: primaryId,
      academicYearId: yearId,
      name: 'Term 1',
      termNumber: 1,
      startDate: `${new Date().getFullYear()}-01-15`,
      endDate: `${new Date().getFullYear()}-04-12`,
      isActive: true,
      createdAt: Date.now(),
    });

    // Generate basic grades for primary
    const grades = [
      { name: 'Grade 1', level: 1 },
      { name: 'Grade 2', level: 2 },
      { name: 'Grade 3', level: 3 },
      { name: 'Grade 4', level: 4 },
      { name: 'Grade 5', level: 5 },
      { name: 'Grade 6', level: 6 },
      { name: 'Grade 7', level: 7, graduationGrade: true },
    ];

    for (const g of grades) {
      await ctx.db.insert('grades', {
        schoolId: primaryId,
        name: g.name,
        level: g.level,
        order: g.level,
        graduationGrade: g.graduationGrade || false,
      });
    }

    return {
      status: 'success',
      message: `Seeded 3 schools (Lukundo, Kafue, Zambezi), plus basic academic setup for Lukundo.`,
      schools: [primaryId, secondaryId, combinedId],
    };
  },
});
