'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Search, Clock, FileText, Lock, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function LessonPlansPage() {
  const subjects = useQuery(api.academics.subjects.getSubjectsBySchool) || [];
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];
  const myPlans = useQuery(api.academics.lessonPlans.getPlansByStaff) || [];

  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('published');

  const filteredPlans = myPlans.filter((plan) => {
    if (selectedSubject !== 'all' && plan.subjectId !== selectedSubject) return false;
    if (selectedGrade !== 'all' && plan.gradeId !== selectedGrade) return false;
    if (plan.status !== activeTab) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson Plans</h1>
          <p className="text-muted-foreground">Manage your syllabus outlines and resources.</p>
        </div>
        <div>
          <Button onClick={() => router.push('/academics/lesson-plans/create')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Lesson Plan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-0 outline-none">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <Select value={selectedSubject} onValueChange={(val) => val && setSelectedSubject(val)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((sub) => (
                  <SelectItem key={sub._id} value={sub._id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGrade} onValueChange={(val) => val && setSelectedGrade(val)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map((g) => (
                  <SelectItem key={g._id} value={g._id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject & Grade</TableHead>
                  <TableHead>Topic Ref</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead>Visibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="mb-3 h-8 w-8 opacity-20" />
                        <p>No lesson plans found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => {
                    const subject = subjects.find((s) => s._id === plan.subjectId);
                    const grade = grades.find((g) => g._id === plan.gradeId);
                    return (
                      <TableRow
                        key={plan._id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/academics/lesson-plans/${plan._id}`)}
                      >
                        <TableCell className="font-medium">
                          {plan.title ? (
                            plan.title
                          ) : (
                            <span className="text-muted-foreground italic">Untitled Draft</span>
                          )}
                          {plan.learningObjectives.length > 0 && (
                            <p className="text-muted-foreground mt-1 max-w-xs truncate text-xs">
                              {plan.learningObjectives[0]}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              {subject?.name || 'Unknown'}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {grade?.name || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.syllabusTopicRef ? (
                            <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                              {plan.syllabusTopicRef}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {plan.duration ? `${plan.duration} mins` : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="text-muted-foreground h-4 w-4" />
                            <span className="text-sm">{plan.resources.length} files</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.status === 'draft' ? (
                            <Badge variant="outline" className="text-xs">
                              Draft
                            </Badge>
                          ) : plan.visibility === 'school' ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                              <Globe className="h-3 w-3" /> Shared
                            </span>
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1 text-xs">
                              <Lock className="h-3 w-3" /> Private
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
