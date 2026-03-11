export function validateAcademicYearDates(startDate: string, endDate: string) {
  if (startDate >= endDate) {
    throw new Error('Start date must be before end date.');
  }
}

export function validateTermDates(
  academicMode: 'semester' | 'term',
  terms: Array<{ name: string; startDate: string; endDate: string }>,
) {
  if (academicMode === 'semester') {
    if (terms.length !== 2) {
      throw new Error('Semester-based schools must have exactly 2 semesters.');
    }
  } else {
    if (terms.length < 2 || terms.length > 4) {
      throw new Error('Term-based schools must have 2–4 terms per academic year.');
    }
  }

  const sortedTerms = [...terms].sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (let i = 0; i < sortedTerms.length; i++) {
    const term = sortedTerms[i];
    if (term.startDate >= term.endDate) {
      throw new Error(`${term.name}: Start date must be before end date.`);
    }
    if (i > 0 && sortedTerms[i - 1].endDate > term.startDate) {
      throw new Error(`Term dates overlap: ${sortedTerms[i - 1].name} and ${term.name}.`);
    }
  }
}

export function isSchoolDayPure(
  date: string,
  events: Array<{ affectsAttendance: boolean; startDate: string; endDate: string }>,
): boolean {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false; // Weekend
  }

  const hasClosureOnDate = events.some(
    (event) => event.affectsAttendance && event.startDate <= date && event.endDate >= date,
  );

  return !hasClosureOnDate;
}
