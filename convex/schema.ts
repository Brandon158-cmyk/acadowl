import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * THE SINGLE SOURCE OF TRUTH for all database tables.
 *
 * Architecture Principle: The schema is the contract.
 * - Additive changes are always allowed
 * - Breaking changes require a migration plan
 * - Every table (except `schools` and `platformAdmins`) has schoolId
 *
 * Tables are organized by sprint/module:
 * - ISSUE-005: schools, academicYears, terms, grades, sections
 * - ISSUE-006: users, staff, guardians
 * - ISSUE-007: students
 * - ISSUE-008: All future module skeleton tables
 */

const schema = defineSchema({
  // ══════════════════════════════════════════════════════════════════
  // ISSUE-005 · Core Schema — Schools, Users, and Academic Structure
  // ══════════════════════════════════════════════════════════════════

  /** The tenant table. One row per school. */
  schools: defineTable({
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

    // Regulatory
    moeCode: v.optional(v.string()),
    heaCode: v.optional(v.string()),
    zraTpin: v.string(),
    zraVsdcSerial: v.optional(v.string()),

    // Academic configuration
    gradingMode: v.union(v.literal('ecz'), v.literal('percentage'), v.literal('gpa')),
    academicMode: v.union(v.literal('term'), v.literal('semester')),
    currentAcademicYearId: v.optional(v.id('academicYears')),
    currentTermId: v.optional(v.id('terms')),

    // Feature flags — the core of adaptive modules
    enabledFeatures: v.array(v.string()),

    // Subscription
    subscriptionTier: v.union(v.literal('starter'), v.literal('standard'), v.literal('premium')),
    subscriptionExpiresAt: v.optional(v.number()),

    // Branding — applied to portal, report cards, invoices
    branding: v.object({
      logoUrl: v.optional(v.string()),
      primaryColor: v.string(),
      secondaryColor: v.string(),
      motto: v.optional(v.string()),
    }),

    // SMS
    smsBalance: v.number(),
    smsProvider: v.union(v.literal('airtel'), v.literal('mtn'), v.literal('auto')),

    // Sibling discount rules
    siblingDiscountRules: v.array(
      v.object({
        fromChildNumber: v.number(),
        discountPercent: v.number(),
        applyToFeeTypes: v.array(v.string()),
      }),
    ),

    // Custom student fields (school-defined)
    customStudentFields: v.array(
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

    // Onboarding — ISSUE-037
    onboardingComplete: v.optional(v.boolean()),

    status: v.union(v.literal('active'), v.literal('suspended'), v.literal('trial')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_status', ['status']),

  /** Academic year — e.g. "2025", "2026" */
  academicYears: defineTable({
    schoolId: v.id('schools'),
    year: v.number(),
    label: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_school_year', ['schoolId', 'year']),

  /** A term or semester within an academic year */
  terms: defineTable({
    schoolId: v.id('schools'),
    academicYearId: v.id('academicYears'),
    name: v.string(),
    termNumber: v.number(),
    startDate: v.string(),
    endDate: v.string(),
    examStartDate: v.optional(v.string()),
    examEndDate: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_academic_year', ['schoolId', 'academicYearId'])
    .index('by_school_active', ['schoolId', 'isActive']),

  /** Grade levels — e.g. Grade 1–12, Form 1–6, Year 1–4 */
  grades: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    level: v.number(),
    stream: v.optional(v.string()),
    graduationGrade: v.boolean(),
    order: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_school_level', ['schoolId', 'level']),

  /** Class sections — e.g. Grade 8A, 8B */
  sections: defineTable({
    schoolId: v.id('schools'),
    gradeId: v.id('grades'),
    academicYearId: v.id('academicYears'),
    name: v.string(),
    displayName: v.string(),
    classTeacherId: v.optional(v.id('staff')),
    capacity: v.optional(v.number()),
    room: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_grade', ['schoolId', 'gradeId'])
    .index('by_academic_year', ['schoolId', 'academicYearId'])
    .index('by_class_teacher', ['classTeacherId']),

  // ══════════════════════════════════════════════════════════════
  // ISSUE-006 · User, Staff, and Guardian Schema
  // ══════════════════════════════════════════════════════════════

  /** Authentication identity. One per login. Linked to Convex Auth. */
  users: defineTable({
    // Convex Auth fields
    tokenIdentifier: v.optional(v.string()),

    // Identity
    schoolId: v.optional(v.id('schools')),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.optional(v.string()),
    photoUrl: v.optional(v.string()),

    // Role — single role per user in a school context
    role: v.optional(
      v.union(
        v.literal('platform_admin'),
        v.literal('school_admin'),
        v.literal('deputy_head'),
        v.literal('bursar'),
        v.literal('teacher'),
        v.literal('class_teacher'),
        v.literal('matron'),
        v.literal('librarian'),
        v.literal('driver'),
        v.literal('guardian'),
        v.literal('student'),
      ),
    ),

    // Profile links
    staffId: v.optional(v.id('staff')),
    guardianId: v.optional(v.id('guardians')),
    studentId: v.optional(v.id('students')),

    // Preferences
    notifPrefs: v.optional(
      v.object({
        sms: v.boolean(),
        whatsapp: v.boolean(),
        email: v.boolean(),
        inApp: v.boolean(),
      }),
    ),
    uiLanguage: v.optional(v.string()),

    isActive: v.optional(v.boolean()),
    isFirstLogin: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index('tokenIdentifier', ['tokenIdentifier'])
    .index('by_school', ['schoolId'])
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('by_role', ['schoolId', 'role']),

  /** Professional profile for teachers and all school employees */
  staff: defineTable({
    schoolId: v.id('schools'),
    userId: v.id('users'),

    // Personal
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    gender: v.union(v.literal('M'), v.literal('F')),
    dateOfBirth: v.optional(v.string()),
    nrc: v.optional(v.string()),
    phone: v.string(),
    altPhone: v.optional(v.string()),
    email: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
        relation: v.string(),
      }),
    ),

    // Professional
    staffCategory: v.union(v.literal('teaching'), v.literal('non_teaching'), v.literal('admin')),
    jobTitle: v.string(),
    tcazNumber: v.optional(v.string()),
    employeeNumber: v.optional(v.string()),
    contractType: v.union(
      v.literal('permanent'),
      v.literal('contract'),
      v.literal('volunteer'),
      v.literal('intern'),
    ),
    dateJoined: v.string(),
    dateLeft: v.optional(v.string()),

    // Payroll-ready (Sprint 03+)
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    napsaNumber: v.optional(v.string()),
    nhimaNumber: v.optional(v.string()),

    // Subjects and sections (populated Sprint 01)
    subjectIds: v.array(v.id('subjects')),
    sectionIds: v.array(v.id('sections')),
    classSectionId: v.optional(v.id('sections')),

    status: v.union(v.literal('active'), v.literal('on_leave'), v.literal('terminated')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_user', ['userId'])
    .index('by_school_status', ['schoolId', 'status'])
    .index('by_tcaz', ['tcazNumber']),

  /** Parent or guardian profile */
  guardians: defineTable({
    schoolId: v.id('schools'),
    userId: v.id('users'),

    // Personal
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    altPhone: v.optional(v.string()),
    email: v.optional(v.string()),
    nrc: v.optional(v.string()),
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
    address: v.optional(v.string()),

    // Preferences
    preferredContactMethod: v.union(v.literal('sms'), v.literal('whatsapp'), v.literal('both')),
    receiveAttendanceSMS: v.boolean(),
    receiveResultsSMS: v.boolean(),
    receiveFeeReminderSMS: v.boolean(),

    isVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_user', ['userId'])
    .index('by_phone', ['phone'])
    .index('by_school_phone', ['schoolId', 'phone']),

  // ══════════════════════════════════════════════════════════════
  // ISSUE-007 · Student Schema
  // ══════════════════════════════════════════════════════════════

  /** Central table of the entire system */
  students: defineTable({
    schoolId: v.id('schools'),

    // Identifiers
    studentNumber: v.string(),
    externalId: v.optional(v.string()),

    // Personal
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    preferredName: v.optional(v.string()),
    dateOfBirth: v.string(),
    gender: v.union(v.literal('M'), v.literal('F')),
    nrc: v.optional(v.string()),
    birthCertNumber: v.optional(v.string()),
    nationality: v.string(),
    homeLanguage: v.optional(v.string()),
    religion: v.optional(v.string()),
    photoUrl: v.optional(v.string()),

    // Academic placement
    currentSectionId: v.id('sections'),
    currentGradeId: v.id('grades'),
    currentAcademicYearId: v.id('academicYears'),
    admissionDate: v.string(),
    admissionGradeId: v.optional(v.id('grades')),
    previousSchool: v.optional(v.string()),

    // Guardian links
    guardianLinks: v.array(
      v.object({
        guardianId: v.id('guardians'),
        isPrimary: v.boolean(),
        relation: v.string(),
        canPayFees: v.boolean(),
        canSeeResults: v.boolean(),
        canSeeAttendance: v.boolean(),
        receiveSMS: v.boolean(),
        canAuthorizeLeave: v.boolean(),
        isEmergencyContact: v.boolean(),
      }),
    ),

    // Boarding — Sprint 04
    boardingStatus: v.union(v.literal('day'), v.literal('boarding')),
    currentBedId: v.optional(v.id('beds')),
    boardingHouseId: v.optional(v.id('hostelBlocks')),
    mealPlanType: v.optional(
      v.union(v.literal('full_board'), v.literal('half_board'), v.literal('none')),
    ),

    // Transport — Sprint 06
    transportRouteId: v.optional(v.id('routes')),
    boardingStopId: v.optional(v.string()),
    transportTermStart: v.optional(v.string()),

    // Health
    bloodGroup: v.optional(v.string()),
    medicalConditions: v.optional(v.string()),
    medications: v.optional(v.string()),
    allergies: v.optional(v.string()),
    specialNeeds: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    doctorPhone: v.optional(v.string()),

    // Custom fields — school-defined key-value pairs
    customFieldValues: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
    ),

    // Status
    status: v.union(
      v.literal('active'),
      v.literal('transferred_out'),
      v.literal('graduated'),
      v.literal('withdrawn'),
      v.literal('deceased'),
    ),
    transferOutDate: v.optional(v.string()),
    transferOutSchool: v.optional(v.string()),
    graduationDate: v.optional(v.string()),

    // Linked auth account (optional)
    userId: v.optional(v.id('users')),

    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id('users'),
  })
    .index('by_school', ['schoolId'])
    .index('by_section', ['currentSectionId'])
    .index('by_school_status', ['schoolId', 'status'])
    .index('by_student_number', ['schoolId', 'studentNumber'])
    .index('by_school_year', ['schoolId', 'currentAcademicYearId']),

  // ══════════════════════════════════════════════════════════════
  // ISSUE-008 · Skeleton Tables for All Future Modules
  // ══════════════════════════════════════════════════════════════

  // ── ATTENDANCE (Sprint 01) ──
  attendance: defineTable({
    schoolId: v.id('schools'),
    sectionId: v.id('sections'),
    studentId: v.id('students'),
    date: v.string(),
    period: v.optional(v.number()),
    staffId: v.id('staff'),
    status: v.union(
      v.literal('present'),
      v.literal('absent'),
      v.literal('late'),
      v.literal('excused'),
      v.literal('medical'),
    ),
    notes: v.optional(v.string()),
    smsSent: v.boolean(),
    clientId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_section_date', ['sectionId', 'date'])
    .index('by_student_date', ['studentId', 'date']),

  // ── SUBJECTS (Sprint 01) ──
  subjects: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    code: v.optional(v.string()),
    gradeIds: v.array(v.id('grades')),
    isCompulsory: v.boolean(),
    eczSubjectCode: v.optional(v.string()),
  }).index('by_school', ['schoolId']),

  // ── TIMETABLE SLOTS (Sprint 01) ──
  timetableSlots: defineTable({
    schoolId: v.id('schools'),
    sectionId: v.id('sections'),
    subjectId: v.id('subjects'),
    staffId: v.id('staff'),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    room: v.optional(v.string()),
    termId: v.id('terms'),
  })
    .index('by_school', ['schoolId'])
    .index('by_section', ['sectionId'])
    .index('by_staff', ['staffId']),

  // ── EXAMS (Sprint 01) ──
  examSessions: defineTable({
    schoolId: v.id('schools'),
    termId: v.id('terms'),
    name: v.string(),
    type: v.union(
      v.literal('ca1'),
      v.literal('ca2'),
      v.literal('terminal'),
      v.literal('mock'),
      v.literal('final'),
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    maxMarks: v.number(),
    weightPercent: v.optional(v.number()),
    isLocked: v.boolean(),
  })
    .index('by_school', ['schoolId'])
    .index('by_term', ['schoolId', 'termId']),

  examResults: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    subjectId: v.id('subjects'),
    examSessionId: v.id('examSessions'),
    sectionId: v.id('sections'),
    score: v.optional(v.number()),
    grade: v.optional(v.string()),
    isAbsent: v.boolean(),
    remarks: v.optional(v.string()),
    enteredBy: v.id('users'),
    lockedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['studentId'])
    .index('by_session', ['examSessionId']),

  // ── FEES & INVOICING (Sprint 02) ──
  feeStructures: defineTable({
    schoolId: v.id('schools'),
    gradeId: v.optional(v.id('grades')),
    termId: v.id('terms'),
    name: v.string(),
    amountZMW: v.number(),
    boardingStatus: v.optional(v.union(v.literal('day'), v.literal('boarding'), v.literal('all'))),
    feeType: v.string(),
    isRecurring: v.boolean(),
    isOptional: v.boolean(),
  })
    .index('by_school', ['schoolId'])
    .index('by_term', ['schoolId', 'termId']),

  invoices: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    guardianId: v.id('guardians'),
    termId: v.id('terms'),
    invoiceNumber: v.string(),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPriceZMW: v.number(),
        vatApplicable: v.boolean(),
        feeType: v.string(),
      }),
    ),
    subtotalZMW: v.number(),
    vatZMW: v.number(),
    discountZMW: v.number(),
    totalZMW: v.number(),
    siblingDiscountZMW: v.number(),
    siblingDiscountApplied: v.boolean(),
    zraFiscalCode: v.optional(v.string()),
    zraQrCodeUrl: v.optional(v.string()),
    zraSubmittedAt: v.optional(v.number()),
    status: v.union(
      v.literal('draft'),
      v.literal('sent'),
      v.literal('partial'),
      v.literal('paid'),
      v.literal('void'),
      v.literal('overdue'),
    ),
    dueDate: v.string(),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['studentId'])
    .index('by_school_term', ['schoolId', 'termId'])
    .index('by_status', ['schoolId', 'status']),

  payments: defineTable({
    schoolId: v.id('schools'),
    invoiceId: v.id('invoices'),
    studentId: v.id('students'),
    amountZMW: v.number(),
    method: v.union(
      v.literal('cash'),
      v.literal('airtel_money'),
      v.literal('mtn_momo'),
      v.literal('bank'),
      v.literal('credit_note'),
    ),
    reference: v.optional(v.string()),
    mobileMoneyReference: v.optional(v.string()),
    receivedBy: v.optional(v.id('users')),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_invoice', ['invoiceId'])
    .index('by_student', ['studentId']),

  // ── NOTIFICATIONS (Sprint 01) ──
  notifications: defineTable({
    schoolId: v.id('schools'),
    recipientUserId: v.optional(v.id('users')),
    recipientPhone: v.optional(v.string()),
    type: v.string(),
    channel: v.union(
      v.literal('sms'),
      v.literal('whatsapp'),
      v.literal('in_app'),
      v.literal('email'),
    ),
    subject: v.optional(v.string()),
    body: v.string(),
    status: v.union(
      v.literal('queued'),
      v.literal('sent'),
      v.literal('delivered'),
      v.literal('failed'),
    ),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_recipient', ['recipientUserId'])
    .index('by_status', ['schoolId', 'status']),

  // ── BOARDING (Sprint 04) ──
  hostelBlocks: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    gender: v.union(v.literal('boys'), v.literal('girls'), v.literal('mixed')),
    wardenStaffId: v.optional(v.id('staff')),
    capacity: v.number(),
    notes: v.optional(v.string()),
  }).index('by_school', ['schoolId']),

  rooms: defineTable({
    schoolId: v.id('schools'),
    hostelBlockId: v.id('hostelBlocks'),
    name: v.string(),
    roomType: v.union(v.literal('dormitory'), v.literal('private'), v.literal('shared')),
    capacity: v.number(),
    floor: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index('by_school', ['schoolId'])
    .index('by_block', ['hostelBlockId']),

  beds: defineTable({
    schoolId: v.id('schools'),
    roomId: v.id('rooms'),
    bedLabel: v.string(),
    position: v.optional(v.string()),
    isActive: v.boolean(),
    currentStudentId: v.optional(v.id('students')),
    currentTermId: v.optional(v.id('terms')),
  })
    .index('by_school', ['schoolId'])
    .index('by_room', ['roomId']),

  sickBayAdmissions: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    admittedAt: v.number(),
    dischargedAt: v.optional(v.number()),
    admittedBy: v.id('staff'),
    reason: v.string(),
    treatmentNotes: v.optional(v.string()),
    guardianNotified: v.boolean(),
    referredToHospital: v.boolean(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['studentId']),

  visitorLog: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    visitorName: v.string(),
    visitorNrc: v.optional(v.string()),
    visitorPhone: v.optional(v.string()),
    relation: v.string(),
    purpose: v.string(),
    checkInAt: v.number(),
    checkOutAt: v.optional(v.number()),
    loggedBy: v.id('staff'),
    isAuthorized: v.boolean(),
    guardianNotified: v.boolean(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['studentId']),

  pocketMoneyAccounts: defineTable({
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    balanceZMW: v.number(),
    weeklyLimitZMW: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_student', ['studentId']),

  pocketMoneyTransactions: defineTable({
    schoolId: v.id('schools'),
    accountId: v.id('pocketMoneyAccounts'),
    type: v.union(v.literal('deposit'), v.literal('withdrawal')),
    amountZMW: v.number(),
    reference: v.optional(v.string()),
    processedBy: v.optional(v.id('staff')),
    notes: v.optional(v.string()),
    guardianNotified: v.boolean(),
    createdAt: v.number(),
  }).index('by_account', ['accountId']),

  // ── TRANSPORT (Sprint 06) ──
  routes: defineTable({
    schoolId: v.id('schools'),
    name: v.string(),
    description: v.optional(v.string()),
    stops: v.array(
      v.object({
        order: v.number(),
        name: v.string(),
        lat: v.number(),
        lng: v.number(),
        scheduledTimeMorning: v.string(),
        scheduledTimeAfternoon: v.string(),
      }),
    ),
    morningVehicleId: v.optional(v.id('vehicles')),
    afternoonVehicleId: v.optional(v.id('vehicles')),
    termFeeZMW: v.number(),
    isActive: v.boolean(),
  }).index('by_school', ['schoolId']),

  vehicles: defineTable({
    schoolId: v.id('schools'),
    registration: v.string(),
    make: v.string(),
    model: v.optional(v.string()),
    capacity: v.number(),
    driverStaffId: v.optional(v.id('staff')),
    insuranceExpiry: v.string(),
    fitnessExpiry: v.string(),
    isActive: v.boolean(),
  }).index('by_school', ['schoolId']),

  gpsPings: defineTable({
    schoolId: v.id('schools'),
    vehicleId: v.id('vehicles'),
    routeId: v.optional(v.id('routes')),
    lat: v.number(),
    lng: v.number(),
    speedKmh: v.number(),
    heading: v.optional(v.number()),
    timestamp: v.number(),
    tripId: v.optional(v.string()),
  }).index('by_vehicle_time', ['vehicleId', 'timestamp']),

  // ── LIBRARY (Sprint 05) ──
  libraryBooks: defineTable({
    schoolId: v.id('schools'),
    isbn: v.optional(v.string()),
    title: v.string(),
    authors: v.array(v.string()),
    publisher: v.optional(v.string()),
    publicationYear: v.optional(v.number()),
    subject: v.optional(v.string()),
    deweyCode: v.optional(v.string()),
    category: v.union(
      v.literal('textbook'),
      v.literal('fiction'),
      v.literal('reference'),
      v.literal('periodical'),
      v.literal('digital'),
    ),
    totalCopies: v.number(),
    availableCopies: v.number(),
    coverUrl: v.optional(v.string()),
  })
    .index('by_school', ['schoolId'])
    .index('by_isbn', ['isbn']),

  libraryIssues: defineTable({
    schoolId: v.id('schools'),
    bookId: v.id('libraryBooks'),
    borrowerId: v.id('users'),
    borrowerType: v.union(v.literal('student'), v.literal('staff')),
    issuedAt: v.number(),
    dueDate: v.string(),
    returnedAt: v.optional(v.number()),
    renewalCount: v.number(),
    fineAmountZMW: v.number(),
    finePaidAt: v.optional(v.number()),
    issuedBy: v.id('staff'),
  })
    .index('by_school', ['schoolId'])
    .index('by_borrower', ['borrowerId']),

  // ── LESSON PLANS (Sprint 01 — ISSUE-046) ──
  lessonPlans: defineTable({
    schoolId: v.id('schools'),
    staffId: v.id('staff'),
    subjectId: v.id('subjects'),
    gradeId: v.id('grades'),
    title: v.string(),
    content: v.optional(v.string()), // Rich text content from TipTap
    status: v.union(v.literal('draft'), v.literal('published')),
    syllabusTopicRef: v.optional(v.string()), // MoE topic reference code
    learningObjectives: v.array(v.string()),
    duration: v.optional(v.number()), // Minutes, optional for drafts
    resources: v.array(
      v.object({
        type: v.union(v.literal('pdf'), v.literal('link'), v.literal('text')),
        title: v.string(),
        url: v.optional(v.string()),
        storageId: v.optional(v.id('_storage')),
        content: v.optional(v.string()),
      }),
    ),
    visibility: v.union(v.literal('private'), v.literal('school')),
    // Sprint 05: lmsLessonId added when converted to LMS lesson
    lmsLessonId: v.optional(v.id('lmsLessons')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_staff', ['staffId'])
    .index('by_subject_grade', ['subjectId', 'gradeId']),

  // ── LMS (Sprint 05) ──
  lmsCourses: defineTable({
    schoolId: v.id('schools'),
    subjectId: v.id('subjects'),
    sectionId: v.id('sections'),
    academicYearId: v.id('academicYears'),
    termId: v.id('terms'),
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id('staff'),
    coverImageUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    minEngagementPercent: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_section', ['sectionId']),

  lmsModules: defineTable({
    schoolId: v.id('schools'),
    courseId: v.id('lmsCourses'),
    title: v.string(),
    order: v.number(),
    isPublished: v.boolean(),
  }).index('by_course', ['courseId']),

  lmsLessons: defineTable({
    schoolId: v.id('schools'),
    moduleId: v.id('lmsModules'),
    title: v.string(),
    contentType: v.union(
      v.literal('text'),
      v.literal('pdf'),
      v.literal('video'),
      v.literal('quiz'),
      v.literal('assignment'),
    ),
    content: v.optional(v.string()),
    resourceUrl: v.optional(v.string()),
    order: v.number(),
    isPublished: v.boolean(),
    unlocksAt: v.optional(v.string()),
  }).index('by_module', ['moduleId']),

  lmsSubmissions: defineTable({
    schoolId: v.id('schools'),
    lessonId: v.id('lmsLessons'),
    studentId: v.id('students'),
    submittedAt: v.number(),
    contentText: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    score: v.optional(v.number()),
    maxScore: v.optional(v.number()),
    gradedAt: v.optional(v.number()),
    gradedBy: v.optional(v.id('staff')),
    feedback: v.optional(v.string()),
  })
    .index('by_lesson', ['lessonId'])
    .index('by_student', ['studentId']),

  // ── HOMEWORK & SUBMISSIONS (Sprint 01 — ISSUE-047) ──
  homework: defineTable({
    schoolId: v.id('schools'),
    title: v.string(),
    description: v.optional(v.string()), // Allows rich text
    subjectId: v.id('subjects'),
    gradeId: v.id('grades'),
    dueDate: v.number(), // Timestamp
    totalPoints: v.optional(v.number()),
    status: v.union(v.literal('draft'), v.literal('published'), v.literal('closed')),
    resources: v.optional(
      v.array(
        v.object({
          title: v.string(),
          type: v.string(),
          url: v.optional(v.string()),
          storageId: v.optional(v.id('_storage')),
        }),
      ),
    ),
  })
    .index('by_school', ['schoolId'])
    .index('by_subject', ['subjectId'])
    .index('by_grade', ['gradeId'])
    .index('by_status', ['status']),

  homeworkSubmissions: defineTable({
    homeworkId: v.id('homework'),
    studentId: v.id('students'), // Students taking the homework
    schoolId: v.id('schools'),
    submittedAt: v.number(),
    content: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          title: v.string(),
          storageId: v.optional(v.id('_storage')),
        }),
      ),
    ),
    status: v.union(v.literal('submitted'), v.literal('graded'), v.literal('late')),
    grade: v.optional(v.number()),
    feedback: v.optional(v.string()),
    gradedBy: v.optional(v.id('users')),
    gradedAt: v.optional(v.string()),
  })
    .index('by_school', ['schoolId'])
    .index('by_homework', ['homeworkId'])
    .index('by_student', ['studentId'])
    .index('by_homework_student', ['homeworkId', 'studentId']),

  // ── SCHOOL EVENTS / CALENDAR (Sprint 01 — ISSUE-043) ──
  schoolEvents: defineTable({
    schoolId: v.id('schools'),
    academicYearId: v.id('academicYears'),
    termId: v.optional(v.id('terms')),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    type: v.union(
      v.literal('holiday'),
      v.literal('exam_period'),
      v.literal('sports_day'),
      v.literal('school_closure'),
      v.literal('parent_teacher'),
      v.literal('general'),
    ),
    affectsAttendance: v.boolean(),
    visibleToParents: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_school', ['schoolId'])
    .index('by_academic_year', ['schoolId', 'academicYearId']),

  // ── CONVEX AUTH TABLES ──
  // Required by @convex-dev/auth
  authAccounts: defineTable({
    userId: v.id('users'),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index('userIdAndProvider', ['userId', 'provider'])
    .index('accountIdAndProvider', ['providerAccountId', 'provider'])
    .index('providerAndAccountId', ['provider', 'providerAccountId'])
    .index('userId', ['userId']),

  authSessions: defineTable({
    userId: v.id('users'),
    expirationTime: v.number(),
  }).index('userId', ['userId']),

  authRefreshTokens: defineTable({
    sessionId: v.id('authSessions'),
    expirationTime: v.number(),
    firstUsedTime: v.optional(v.number()),
    parentRefreshTokenId: v.optional(v.id('authRefreshTokens')),
  })
    .index('sessionId', ['sessionId'])
    .index('sessionIdAndParentRefreshTokenId', ['sessionId', 'parentRefreshTokenId']),

  authVerificationCodes: defineTable({
    accountId: v.id('authAccounts'),
    code: v.string(),
    expirationTime: v.number(),
    verifier: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index('accountId', ['accountId'])
    .index('code', ['code']),

  authRateLimits: defineTable({
    identifier: v.string(),
    lastAttemptTime: v.number(),
    attemptsCount: v.number(),
  }).index('identifier', ['identifier']),
});

export default schema;
