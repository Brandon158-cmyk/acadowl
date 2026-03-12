'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
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
import { PlusCircle, Search, Calendar, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';

// Stable mount-time snapshot used to classify overdue assignments.
// Computed at module evaluation — pure from the React Compiler's perspective.
const _NOW_AT_LOAD = Date.now();

export default function HomeworkPage() {
  const subjects = useQuery(api.academics.subjects.getSubjectsBySchool) || [];
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];

  // Use local state filters for the query
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('published');

  const queryArgs = {
    subjectId: selectedSubject !== 'all' ? (selectedSubject as Id<'subjects'>) : undefined,
    gradeId: selectedGrade !== 'all' ? (selectedGrade as Id<'grades'>) : undefined,
  };

  const homeworkData = useQuery(api.academics.homework.getHomeworkList, queryArgs) || [];

  const router = useRouter();

  const filteredHomework = homeworkData.filter((hw) => {
    if (activeTab === 'closed') {
      // Include explicitly closed OR overdue published assignments
      return hw.status === 'closed' || (hw.status === 'published' && hw.dueDate < _NOW_AT_LOAD);
    }
    if (activeTab === 'published') {
      // Published tab only shows non-overdue published assignments
      return hw.status === 'published' && hw.dueDate >= _NOW_AT_LOAD;
    }
    return hw.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Homework Assignments</h1>
          <p className="text-muted-foreground">
            Manage homework, assignments, and track submissions.
          </p>
        </div>
        <div>
          <Button onClick={() => router.push('/academics/homework/create')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Assignment
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="closed">Closed / Past</TabsTrigger>
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
                  <TableHead>Due Date</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Resources</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHomework.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground h-32 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="mb-3 h-8 w-8 opacity-20" />
                        <p>No assignments found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHomework.map((hw) => {
                    return (
                      <TableRow
                        key={hw._id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/academics/homework/${hw._id}`)}
                      >
                        <TableCell className="font-medium">
                          {hw.title ? (
                            hw.title
                          ) : (
                            <span className="text-muted-foreground italic">
                              Untitled Assignment
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{hw.subjectName}</span>
                            <span className="text-muted-foreground text-xs">{hw.gradeName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {hw.dueDate ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                              <span>{format(new Date(hw.dueDate), 'MMM d, yyyy h:mm a')}</span>
                              {isPast(new Date(hw.dueDate)) && hw.status !== 'closed' && (
                                <Badge
                                  variant="destructive"
                                  className="ml-1 h-4 px-1 py-0 text-[10px]"
                                >
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{hw.totalPoints ? `${hw.totalPoints} pts` : '-'}</TableCell>
                        <TableCell>
                          {hw.resources && hw.resources.length > 0 ? (
                            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                              <FileText className="h-4 w-4" />
                              <span>{hw.resources.length}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
