import { describe, it, expect } from 'vitest';
import {
  validateAcademicYearDates,
  validateTermDates,
  isSchoolDayPure,
} from '../schools/validation';

describe('Academic Year Validations', () => {
  describe('validateAcademicYearDates', () => {
    it('should throw an error if start date is after end date', () => {
      expect(() => validateAcademicYearDates('2025-12-31', '2025-01-01')).toThrow(
        'Start date must be before end date.',
      );
    });

    it('should throw an error if start date is same as end date', () => {
      expect(() => validateAcademicYearDates('2025-01-01', '2025-01-01')).toThrow(
        'Start date must be before end date.',
      );
    });

    it('should not throw if dates are valid', () => {
      expect(() => validateAcademicYearDates('2025-01-01', '2025-12-31')).not.toThrow();
    });
  });

  describe('validateTermDates', () => {
    it('should enforce exactly 2 terms for semester mode', () => {
      const terms = [{ name: 'Semester 1', startDate: '2025-01-01', endDate: '2025-06-30' }];
      expect(() => validateTermDates('semester', terms)).toThrow(
        'Semester-based schools must have exactly 2 semesters.',
      );
    });

    it('should enforce 2-4 terms for term mode', () => {
      const terms = [{ name: 'Term 1', startDate: '2025-01-01', endDate: '2025-03-31' }];
      expect(() => validateTermDates('term', terms)).toThrow(
        'Term-based schools must have 2–4 terms per academic year.',
      );
    });

    it('should throw error if term dates overlap', () => {
      const terms = [
        { name: 'Term 1', startDate: '2025-01-01', endDate: '2025-04-30' },
        { name: 'Term 2', startDate: '2025-04-15', endDate: '2025-08-31' },
      ];
      expect(() => validateTermDates('term', terms)).toThrow(
        'Term dates overlap: Term 1 and Term 2.',
      );
    });

    it('should allow valid term definitions', () => {
      const terms = [
        { name: 'Term 1', startDate: '2025-01-01', endDate: '2025-04-14' },
        { name: 'Term 2', startDate: '2025-05-01', endDate: '2025-08-31' },
        { name: 'Term 3', startDate: '2025-09-01', endDate: '2025-12-15' },
      ];
      expect(() => validateTermDates('term', terms)).not.toThrow();
    });
  });

  describe('isSchoolDayPure', () => {
    const events = [
      { affectsAttendance: true, startDate: '2025-01-01', endDate: '2025-01-01' }, // New Year (Wed)
      { affectsAttendance: false, startDate: '2025-02-14', endDate: '2025-02-14' }, // Gen Event (Fri)
    ];

    it('should return false for weekends', () => {
      // 2025-01-04 is a Saturday
      expect(isSchoolDayPure('2025-01-04', events)).toBe(false);
      // 2025-01-05 is a Sunday
      expect(isSchoolDayPure('2025-01-05', events)).toBe(false);
    });

    it('should return false for holidays (events that affect attendance)', () => {
      // 2025-01-01 is a Wednesday but is a holiday
      expect(isSchoolDayPure('2025-01-01', events)).toBe(false);
    });

    it('should return true for events that do not affect attendance', () => {
      // 2025-02-14 is a Friday and has an event but it does not affect attendance
      expect(isSchoolDayPure('2025-02-14', events)).toBe(true);
    });

    it('should return true for normal weekdays', () => {
      // 2025-01-02 is a normal Thursday
      expect(isSchoolDayPure('2025-01-02', events)).toBe(true);
    });
  });
});
