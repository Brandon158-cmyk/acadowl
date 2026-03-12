'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
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
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateLessonPlanPage() {
  const router = useRouter();
  const subjects = useQuery(api.academics.subjects.getSubjectsBySchool) || [];
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];
  const createPlan = useMutation(api.academics.lessonPlans.createPlan);

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !gradeId) {
      toast.error('Subject and Grade are required to start a draft.');
      return;
    }

    try {
      setIsSubmitting(true);
      const id = await createPlan({
        title: title || 'Untitled Draft',
        subjectId: subjectId as Id<'subjects'>,
        gradeId: gradeId as Id<'grades'>,
        status: 'draft',
        learningObjectives: [],
        resources: [],
        visibility: 'private',
      });
      toast.success('Draft created! Redirecting to editor...');
      router.push(`/academics/lesson-plans/${id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start draft.';
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/academics/lesson-plans')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Lesson Plan</h1>
          <p className="text-muted-foreground">Setup your draft to begin editing.</p>
        </div>
      </div>

      <div className="bg-card rounded-md border p-6">
        <form onSubmit={handleStartDraft} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g. Introduction to Fractions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={subjectId} onValueChange={(val) => val && setSubjectId(val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub._id} value={sub._id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade *</Label>
              <Select value={gradeId} onValueChange={(val) => val && setGradeId(val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade._id} value={grade._id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push('/academics/lesson-plans')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !subjectId || !gradeId}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Start Drafting
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
