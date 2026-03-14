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
import { ChevronLeft, Loader2, Sparkles, BookOpen, GraduationCap, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

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
    if (isSubmitting) return;
    if (!subjectId || !gradeId) {
      toast.error('Subject and Grade are required to start a draft.');
      return;
    }

    setIsSubmitting(true);
    try {
      const id = await createPlan({
        title: title.trim() || 'Untitled Draft',
        subjectId: subjectId as Id<'subjects'>,
        gradeId: gradeId as Id<'grades'>,
        status: 'draft',
        learningObjectives: [],
        resources: [],
        visibility: 'private',
      });
      toast.success('Draft created! Opening editor...');
      router.push(`/academics/lesson-plans/${id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start draft.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 pt-8 pb-20">
      {/* Back Button & Title */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="-ml-4 h-9 w-fit text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          onClick={() => router.push('/academics/lesson-plans')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Repository
        </Button>
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-gray-900">
            New Lesson Plan
          </h1>
          <p className="mt-1 text-gray-500 italic">
            Initialize your lesson structure and metadata to begin drafting.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-none bg-white shadow-xl ring-1 shadow-gray-200/50 ring-gray-100">
        <div className="border-b border-[#2D9B4E]/10 bg-[#2D9B4E]/5 px-6 py-4">
          <p className="text-sm font-semibold tracking-wider text-[#2D9B4E] uppercase">
            Plan Configuration
          </p>
        </div>

        <form onSubmit={handleStartDraft} className="space-y-8 p-8">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-bold text-gray-700">
              Lesson Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Chemical Bonds and Interactions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 border-gray-200 bg-gray-50/50 px-4 transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <BookOpen className="h-4 w-4 text-gray-400" />
                Subject <span className="text-red-500">*</span>
              </Label>
              <Select value={subjectId} onValueChange={(val) => val && setSubjectId(val)} required>
                <SelectTrigger className="h-12 border-gray-200 bg-gray-50/50 transition-all focus:bg-white">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {subjects.map((sub) => (
                    <SelectItem key={sub._id} value={sub._id} className="py-2.5">
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                Grade <span className="text-red-500">*</span>
              </Label>
              <Select value={gradeId} onValueChange={(val) => val && setGradeId(val)} required>
                <SelectTrigger className="h-12 border-gray-200 bg-gray-50/50 transition-all focus:bg-white">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {grades.map((grade) => (
                    <SelectItem key={grade._id} value={grade._id} className="py-2.5">
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-3 border-t border-gray-100 pt-4 sm:flex-row">
            <Button
              variant="outline"
              type="button"
              className="h-12 border-gray-200 px-8 font-semibold text-gray-600 hover:bg-gray-50"
              onClick={() => router.push('/academics/lesson-plans')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !subjectId || !gradeId}
              className="h-12 bg-[#2D9B4E] px-8 font-semibold shadow-lg shadow-green-900/10 transition-all hover:bg-[#217A3C] active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Initialize Draft
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex items-start gap-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
        <div>
          <p className="text-sm font-bold text-amber-900">Pro Tip</p>
          <p className="text-sm leading-relaxed text-amber-800/80">
            You can skip the title for now and add it later in the editor. Drafts are saved
            automatically as you type.
          </p>
        </div>
      </div>
    </div>
  );
}
