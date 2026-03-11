'use client';

import { useState, useEffect, use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ChevronLeft, Loader2, Save, FileUp, Trash2, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Resource {
  type: 'pdf' | 'link' | 'text';
  title: string;
  url?: string;
  storageId?: Id<'_storage'>;
  content?: string;
}

interface LessonPlanFormData {
  title: string;
  subjectId: string;
  gradeId: string;
  syllabusTopicRef?: string;
  duration?: string;
  content?: string;
  visibility: 'private' | 'school';
  status: 'draft' | 'published';
  resources?: Resource[];
}

export default function LessonPlanEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const planId = unwrappedParams.id as Id<'lessonPlans'>;

  const plan = useQuery(api.academics.lessonPlans.getPlanById, { id: planId });
  const updatePlan = useMutation(api.academics.lessonPlans.updatePlan);
  const generateUploadUrl = useMutation(api.academics.lessonPlans.generateUploadUrl);

  const subjects = useQuery(api.academics.subjects.getSubjectsBySchool) || [];
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];

  // Local state for auto-save
  const [formData, setFormData] = useState<LessonPlanFormData | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [uploadingResource, setUploadingResource] = useState(false);

  // Initialize local state once plan is loaded
  useEffect(() => {
    if (plan && !formData) {
      setFormData({
        title: plan.title,
        subjectId: plan.subjectId,
        gradeId: plan.gradeId,
        syllabusTopicRef: plan.syllabusTopicRef || '',
        duration: plan.duration ? String(plan.duration) : '',
        content: plan.content || '',
        visibility: plan.visibility,
        status: plan.status,
        resources: plan.resources,
      });
    }
  }, [plan, formData]);

  // Debounced Auto-save
  useEffect(() => {
    if (!formData || !plan) return;

    const hasChanges =
      formData.title !== plan.title ||
      formData.content !== (plan.content || '') ||
      formData.status !== plan.status ||
      Number(formData.duration || 0) !== (plan.duration || 0) ||
      formData.syllabusTopicRef !== (plan.syllabusTopicRef || '') ||
      formData.visibility !== plan.visibility;

    if (!hasChanges) return;

    setSaveStatus('saving');
    const timeoutId = setTimeout(async () => {
      try {
        await updatePlan({
          id: planId,
          title: formData.title,
          content: formData.content,
          status: formData.status,
          syllabusTopicRef: formData.syllabusTopicRef || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          visibility: formData.visibility,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [formData, plan, planId, updatePlan]);

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResource(true);
    try {
      // 1. Get upload URL
      const uploadUrl = await generateUploadUrl();

      // 2. Upload to Convex Storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // 3. Save to plan
      const newResource = {
        type: 'pdf' as const, // Simplify for now, could be derived from file.type
        title: file.name,
        storageId: storageId as Id<'_storage'>,
      };

      await updatePlan({
        id: planId,
        resources: [...(formData.resources || []), newResource],
      });

      setFormData((prev) =>
        prev
          ? {
              ...prev,
              resources: [...(prev.resources || []), newResource],
            }
          : null,
      );

      toast.success('Resource uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file');
    } finally {
      setUploadingResource(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  const removeResource = async (index: number) => {
    if (!formData) return;

    const newResources = [...(formData.resources || [])];
    newResources.splice(index, 1);

    setFormData((prev) => (prev ? { ...prev, resources: newResources } : null));

    try {
      setSaveStatus('saving');
      await updatePlan({
        id: planId,
        resources: newResources,
      });
      setSaveStatus('saved');
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      toast.error('Failed to remove resource');
    }
  };

  const handlePublishToggle = () => {
    const newStatus = formData?.status === 'draft' ? 'published' : 'draft';
    setFormData((prev) => (prev ? { ...prev, status: newStatus } : null));
    if (newStatus === 'published') {
      toast.success('Lesson Plan Published!');
    } else {
      toast.success('Reverted to Draft.');
    }
  };

  if (plan === null) {
    return <div className="p-12 text-center text-red-500">Lesson plan not found.</div>;
  }

  if (plan === undefined || !formData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-6 pb-24">
      {/* Header */}
      <div className="bg-card sticky top-4 z-10 flex flex-col items-start justify-between gap-4 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/academics/lesson-plans')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {formData.title || 'Untitled Lesson Plan'}
            </h1>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Save className="h-3 w-3" /> Saved
                  </>
                )}
                {saveStatus === 'error' && <span className="text-red-500">Failed to save</span>}
              </span>
              <span>•</span>
              <span className="capitalize">{formData.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {formData.status === 'draft' ? (
            <Button
              onClick={handlePublishToggle}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Publish Plan
            </Button>
          ) : (
            <Button onClick={handlePublishToggle} variant="outline">
              Revert to Draft
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4">
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-auto border-none bg-transparent px-0 py-3 text-2xl font-bold shadow-none focus-visible:ring-0"
              placeholder="Lesson Title..."
            />

            <div className="bg-card text-card-foreground rounded-md border">
              <RichTextEditor
                content={formData.content || ''}
                onChange={(content) => setFormData({ ...formData, content })}
              />
            </div>
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-6">
          <div className="bg-card space-y-4 rounded-md border p-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Details
            </h3>

            <div className="space-y-2">
              <Label className="text-xs">Subject</Label>
              <Input
                value={subjects.find((s) => s._id === formData.subjectId)?.name || 'Loading...'}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Grade</Label>
              <Input
                value={grades.find((g) => g._id === formData.gradeId)?.name || 'Loading...'}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Duration (Minutes)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 45"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Syllabus Topic Ref</Label>
              <Input
                value={formData.syllabusTopicRef}
                onChange={(e) => setFormData({ ...formData, syllabusTopicRef: e.target.value })}
                placeholder="e.g. MOE-MATH-2.1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Visibility</Label>
              <Select
                value={formData.visibility}
                onValueChange={(val) =>
                  setFormData({ ...formData, visibility: val as 'private' | 'school' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (Only Me)</SelectItem>
                  <SelectItem value="school">School (All Teachers)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                Resources
              </h3>
              <div>
                <Label htmlFor="resource-upload" className="cursor-pointer">
                  <div className="text-primary flex items-center gap-1 text-xs hover:underline">
                    {uploadingResource ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <FileUp className="h-3 w-3" />
                    )}
                    Upload File
                  </div>
                </Label>
                <Input
                  id="resource-upload"
                  type="file"
                  className="hidden"
                  onChange={handleResourceUpload}
                  disabled={uploadingResource}
                />
              </div>
            </div>

            {formData.resources?.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm italic">
                No resources attached.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.resources?.map((res, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/50 flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <div className="flex max-w-[200px] items-center gap-2 truncate">
                      {res.type === 'link' ? (
                        <LinkIcon className="h-3 w-3 shrink-0 text-blue-500" />
                      ) : (
                        <FileUp className="h-3 w-3 shrink-0 text-red-500" />
                      )}
                      <span className="truncate" title={res.title}>
                        {res.title}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-6 w-6"
                      onClick={() => removeResource(idx)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
