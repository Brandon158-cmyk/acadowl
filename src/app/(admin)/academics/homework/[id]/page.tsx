'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  CloudUpload,
  File as FileIcon,
  Loader2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface HomeworkResource {
  type: string;
  title: string;
  url?: string | null;
  storageId?: Id<'_storage'>;
}

interface HomeworkFormData {
  title: string;
  description: string;
  subjectId: string;
  gradeId: string;
  dueDate: string;
  totalPoints: string;
  status: 'draft' | 'published' | 'closed';
  resources: HomeworkResource[];
}

/**
 * Format a UTC timestamp as a local datetime-local string (YYYY-MM-DDTHH:mm)
 * without UTC shifting, so the displayed time matches the user's timezone.
 */
function toDateTimeLocal(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/**
 * Strip null/undefined urls before sending resources to the mutation,
 * which only accepts url?: string (not null).
 */
function sanitizeResources(
  resources: HomeworkResource[],
): Array<{ title: string; type: string; url?: string; storageId?: Id<'_storage'> }> {
  return resources.map(({ title, type, url, storageId }) => ({
    title,
    type: type || 'file',
    ...(url != null ? { url } : {}),
    ...(storageId ? { storageId } : {}),
  }));
}

export default function HomeworkEditorPage() {
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as Id<'homework'>;

  const homework = useQuery(api.academics.homework.getHomeworkById, { id: homeworkId });
  const submissions =
    useQuery(api.academics.homeworkSubmissions.getSubmissionsForHomework, { homeworkId }) || [];

  const subjects = useQuery(api.academics.subjects.getSubjectsBySchool) || [];
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];

  const updateHomework = useMutation(api.academics.homework.updateHomework);
  const deleteHomework = useMutation(api.academics.homework.deleteHomework);
  const generateUploadUrl = useMutation(api.academics.homework.generateUploadUrl);
  const gradeSubmission = useMutation(api.academics.homeworkSubmissions.gradeSubmission);

  const [formData, setFormData] = useState<HomeworkFormData | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [uploadingResource, setUploadingResource] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [gradingSubId, setGradingSubId] = useState<Id<'homeworkSubmissions'> | null>(null);
  const [tempGrade, setTempGrade] = useState('');
  const [tempFeedback, setTempFeedback] = useState('');

  // Initialize form data once fetched
  useEffect(() => {
    if (homework && formData === undefined) {
      setFormData({
        title: homework.title,
        description: homework.description || '',
        subjectId: homework.subjectId,
        gradeId: homework.gradeId,
        dueDate: toDateTimeLocal(homework.dueDate),
        totalPoints: homework.totalPoints ? String(homework.totalPoints) : '100',
        status: homework.status as 'draft' | 'published' | 'closed',
        resources: (homework.resources as HomeworkResource[]) || [],
      });
    }
  }, [homework, formData]);

  // Debounced auto-save
  useEffect(() => {
    if (!formData || !homework) return;

    const hasChanges =
      formData.title !== homework.title ||
      formData.description !== (homework.description || '') ||
      formData.status !== homework.status ||
      formData.totalPoints !== String(homework.totalPoints || '') ||
      formData.dueDate !== toDateTimeLocal(homework.dueDate) ||
      formData.subjectId !== homework.subjectId ||
      formData.gradeId !== homework.gradeId;

    if (!hasChanges) return;

    setSaveStatus('saving');
    const timeoutId = setTimeout(async () => {
      try {
        await updateHomework({
          id: homeworkId,
          title: formData.title,
          description: formData.description,
          status: formData.status,
          totalPoints: formData.totalPoints ? parseInt(formData.totalPoints) : undefined,
          dueDate: new Date(formData.dueDate).getTime(),
          subjectId: formData.subjectId as Id<'subjects'>,
          gradeId: formData.gradeId as Id<'grades'>,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [formData, homework, homeworkId, updateHomework]);

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResource(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();

      const newResource = {
        type: 'file',
        title: file.name,
        storageId: storageId as Id<'_storage'>,
      };

      await updateHomework({
        id: homeworkId,
        resources: sanitizeResources([...(formData.resources || []), newResource]),
      });

      setFormData((prev) =>
        prev ? { ...prev, resources: [...(prev.resources || []), newResource] } : undefined,
      );
      toast.success('Resource attached!');
    } catch {
      toast.error('Failed to attach resource');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleRemoveResource = async (index: number) => {
    if (!formData) return;
    const updatedResources = [...formData.resources];
    updatedResources.splice(index, 1);
    try {
      await updateHomework({
        id: homeworkId,
        resources: sanitizeResources(updatedResources),
      });
      setFormData({ ...formData, resources: updatedResources });
    } catch {
      toast.error('Failed to remove resource');
    }
  };

  const handleDeleteAssignment = async () => {
    if (!confirm('Are you sure you want to delete this assignment and all submissions?')) return;
    try {
      await deleteHomework({ id: homeworkId });
      toast.success('Assignment deleted');
      router.push('/academics/homework');
    } catch {
      toast.error('Failed to delete assignment');
    }
  };

  const submitGrade = async (subId: Id<'homeworkSubmissions'>) => {
    try {
      await gradeSubmission({
        submissionId: subId,
        grade: parseInt(tempGrade),
        feedback: tempFeedback,
      });
      toast.success('Grade submitted successfully');
      setGradingSubId(null);
    } catch {
      toast.error('Failed to submit grade');
    }
  };

  if (homework === null) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">Assignment not found</h2>
        <Button onClick={() => router.push('/academics/homework')}>Back to Homework</Button>
      </div>
    );
  }

  if (homework === undefined || formData === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-6 pb-20">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/academics/homework')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Assignment Editor</h1>
              <Badge
                variant={
                  formData.status === 'published'
                    ? 'default'
                    : formData.status === 'closed'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {formData.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving draft...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>Draft saved</span>
                </>
              )}
              {saveStatus === 'error' && <span className="text-red-500">Failed to save</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={handleDeleteAssignment}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            variant={formData.status === 'published' ? 'outline' : 'default'}
            onClick={() => {
              const newStatus = formData.status === 'published' ? 'draft' : 'published';
              setFormData({ ...formData, status: newStatus });
              toast.success(`Assignment marked as ${newStatus}`);
            }}
          >
            {formData.status === 'published' ? 'Unpublish' : 'Publish Assignment'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Assignment Editor</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions
            {submissions.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 ml-2">
                {submissions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Left Col: Main Editor */}
            <div className="space-y-6 md:col-span-2">
              <div className="bg-card space-y-4 rounded-xl border p-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Assignment Title</Label>
                  <Input
                    className="text-lg font-medium"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Instructions / Description</Label>
                  <div className="min-h-[300px]">
                    <RichTextEditor
                      content={formData.description}
                      onChange={(html) => setFormData({ ...formData, description: html })}
                      placeholder="Write your assignment instructions here..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Metadata & Resources */}
            <div className="space-y-6">
              <div className="bg-card space-y-4 rounded-xl border p-6">
                <h3 className="mb-4 border-b pb-2 font-semibold">Details</h3>

                <div className="space-y-2">
                  <Label className="text-xs">Subject</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(val) => val && setFormData({ ...formData, subjectId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Grade</Label>
                  <Select
                    value={formData.gradeId}
                    onValueChange={(val) => val && setFormData({ ...formData, gradeId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g._id} value={g._id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Due Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Total Points</Label>
                  <Input
                    type="number"
                    value={formData.totalPoints}
                    onChange={(e) => setFormData({ ...formData, totalPoints: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) =>
                      setFormData({ ...formData, status: val as 'draft' | 'published' | 'closed' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-card space-y-4 rounded-xl border p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Resources & Attachments</h3>
                </div>

                {formData.resources.length > 0 ? (
                  <ul className="space-y-2">
                    {formData.resources.map((res, idx) => (
                      <li
                        key={idx}
                        className="bg-muted/50 flex items-center justify-between rounded-md border p-2 text-sm"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                          <a
                            href={res.url ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate hover:underline"
                          >
                            {res.title}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleRemoveResource(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground py-4 text-center text-xs">
                    No attachments yet.
                  </p>
                )}

                <div className="relative">
                  <Input
                    type="file"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={handleResourceUpload}
                    disabled={uploadingResource}
                  />
                  <Button
                    variant="outline"
                    className="pointer-events-none w-full"
                    disabled={uploadingResource}
                  >
                    {uploadingResource ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CloudUpload className="mr-2 h-4 w-4" />
                    )}
                    Upload File
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="outline-none">
          <div className="bg-card rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground h-32 text-center">
                      No submissions found yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => (
                    <TableRow key={sub._id}>
                      <TableCell className="font-medium">{sub.studentName}</TableCell>
                      <TableCell>
                        <div className="text-sm">{format(new Date(sub.submittedAt), 'PP p')}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sub.status === 'graded'
                              ? 'default'
                              : sub.status === 'late'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {sub.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.grade !== undefined
                          ? `${sub.grade} / ${homework.totalPoints || 100}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {gradingSubId === sub._id ? (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Grade"
                                className="w-20"
                                value={tempGrade}
                                onChange={(e) => setTempGrade(e.target.value)}
                              />
                              <Input
                                placeholder="Feedback..."
                                className="w-32"
                                value={tempFeedback}
                                onChange={(e) => setTempFeedback(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setGradingSubId(null)}
                              >
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => submitGrade(sub._id)}>
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setGradingSubId(sub._id);
                              setTempGrade(sub.grade !== undefined ? String(sub.grade) : '');
                              setTempFeedback(sub.feedback || '');
                            }}
                          >
                            {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
