import { redirect } from 'next/navigation';

export default function AcademicsPage() {
  // Redirect to the first child route of Academics Group
  redirect('/academics/subjects');
}
