/**
 * ECZ (Examinations Council of Zambia) grading scales and subject codes.
 * Used for exam results, report cards, and Grade 9/12 final exam processing.
 */

/** Standard ECZ 1-9 grading scale for primary/secondary schools */
export const ECZ_GRADE_SCALE = [
  { grade: '1', label: 'Distinction', minPercent: 80, maxPercent: 100 },
  { grade: '2', label: 'Merit', minPercent: 70, maxPercent: 79 },
  { grade: '3', label: 'Credit', minPercent: 60, maxPercent: 69 },
  { grade: '4', label: 'Credit', minPercent: 55, maxPercent: 59 },
  { grade: '5', label: 'Credit', minPercent: 50, maxPercent: 54 },
  { grade: '6', label: 'Credit', minPercent: 45, maxPercent: 49 },
  { grade: '7', label: 'Pass', minPercent: 40, maxPercent: 44 },
  { grade: '8', label: 'Pass', minPercent: 35, maxPercent: 39 },
  { grade: '9', label: 'Fail', minPercent: 0, maxPercent: 34 },
] as const;

/** Convert a percentage to an ECZ grade */
export function percentToEczGrade(percent: number): string {
  const entry = ECZ_GRADE_SCALE.find((g) => percent >= g.minPercent && percent <= g.maxPercent);
  return entry?.grade ?? '9';
}

/** Get grade label from ECZ grade number */
export function eczGradeLabel(grade: string): string {
  const entry = ECZ_GRADE_SCALE.find((g) => g.grade === grade);
  return entry?.label ?? 'Unknown';
}

/** GPA scale for tertiary institutions */
export const GPA_SCALE = [
  { grade: 'A+', gpa: 4.0, minPercent: 90, label: 'Excellent' },
  { grade: 'A', gpa: 4.0, minPercent: 80, label: 'Excellent' },
  { grade: 'B+', gpa: 3.5, minPercent: 70, label: 'Very Good' },
  { grade: 'B', gpa: 3.0, minPercent: 60, label: 'Good' },
  { grade: 'C+', gpa: 2.5, minPercent: 55, label: 'Above Average' },
  { grade: 'C', gpa: 2.0, minPercent: 50, label: 'Average' },
  { grade: 'D', gpa: 1.0, minPercent: 40, label: 'Below Average' },
  { grade: 'F', gpa: 0.0, minPercent: 0, label: 'Fail' },
] as const;

/** Standard primary grade levels (Grade 1-7) */
export const PRIMARY_GRADES = [1, 2, 3, 4, 5, 6, 7] as const;

/** Standard secondary grade levels (Grade 8-12) */
export const SECONDARY_GRADES = [8, 9, 10, 11, 12] as const;

/** ECZ exam levels */
export const ECZ_EXAM_LEVELS = [
  { grade: 7, label: 'Grade 7 National Exams' },
  { grade: 9, label: 'Grade 9 Junior Secondary' },
  { grade: 12, label: 'Grade 12 School Certificate' },
] as const;
