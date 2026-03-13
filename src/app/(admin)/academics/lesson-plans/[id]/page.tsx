'use client';

import { useState, useEffect, use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  ChevronLeft,
  Loader2,
  FileUp,
  Trash2,
  Link as LinkIcon,
  Globe,
  Lock,
  Clock,
  Layout,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  Settings2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  // Keep the raw string param; Convex returns null for non-existent IDs so
  // invalid-but-well-formed strings still show the "not found" state gracefully.
  // We skip the query entirely for an empty string to avoid a confusing error.
  const rawId = unwrappedParams.id;
  const planId = rawId as Id<'lessonPlans'>;

  const plan = useQuery(api.academics.lessonPlans.getPlanById, rawId ? { id: planId } : 'skip');
  const updatePlan = useMutation(api.academics.lessonPlans.updatePlan);
  const generateUploadUrl = useMutation(api.academics.lessonPlans.generateUploadUrl);

  const subjects = useQuery(api.academics.subjects.getSubjectsBySchool) || [];
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];

  // Collect storageIds from the loaded plan so we can resolve download URLs
  const storageIds = (plan?.resources ?? [])
    .map((r) => r.storageId)
    .filter((id): id is Id<'_storage'> => id != null);
  const storageUrlMap =
    useQuery(
      api.academics.lessonPlans.getStorageUrls,
      storageIds.length > 0 ? { storageIds } : 'skip',
    ) ?? {};

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
      if (!result.ok) {
        const text = await result.text().catch(() => result.statusText);
        throw new Error(`Upload failed (${result.status}): ${text}`);
      }
      const { storageId } = await result.json();

      // 3. Derive resource type from MIME
      const mime = file.type;
      const resourceType: 'pdf' | 'text' | 'link' =
        mime === 'application/pdf' ? 'pdf' : mime.startsWith('text/') ? 'text' : 'link';

      // 4. Save to plan
      const newResource = {
        type: resourceType,
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

    const prevResources = formData.resources || [];
    const newResources = [...prevResources];
    newResources.splice(index, 1);

    // Optimistic update
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
      // Roll back to previous state on failure
      setFormData((prev) => (prev ? { ...prev, resources: prevResources } : null));
      setSaveStatus('error');
      toast.error('Failed to remove resource');
    }
  };

  const handlePublishToggle = async () => {
    if (!formData) return;
    const newStatus = formData.status === 'draft' ? 'published' : 'draft';
    // Optimistic UI flip
    setFormData((prev) => (prev ? { ...prev, status: newStatus } : null));
    try {
      await updatePlan({ id: planId, status: newStatus });
      toast.success(newStatus === 'published' ? 'Lesson Plan Published!' : 'Reverted to Draft.');
    } catch (error) {
      console.error(error);
      // Roll back on failure
      setFormData((prev) => (prev ? { ...prev, status: formData.status } : null));
      toast.error('Failed to update status. Please try again.');
    }
  };

  if (plan === null) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="rounded-full bg-red-50 p-6 text-red-500">
          <AlertCircle className="h-12 w-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plan Not Found</h2>
          <p className="mt-1 text-gray-500">
            The lesson plan you are looking for does not exist or has been deleted.
          </p>
        </div>
        <Button
          onClick={() => router.push('/academics/lesson-plans')}
          variant="outline"
          className="mt-4"
        >
          Return to Repository
        </Button>
      </div>
    );
  }

  if (plan === undefined || !formData) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#2D9B4E]" />
          <p className="text-sm font-medium text-gray-500">Retrieving lesson details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      {/* Sticky Premium Header */}
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4 truncate">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => router.push('/academics/lesson-plans')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-2 truncate text-sm">
                <span className="text-gray-400">Lesson Repository</span>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-[#2D9B4E]">
                  {subjects.find((s) => s._id === formData.subjectId)?.name}
                </span>
              </div>
              <h1 className="truncate text-lg leading-tight font-bold text-gray-900">
                {formData.title || (
                  <span className="font-normal text-gray-400 italic">Untitled Lesson Plan</span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold transition-colors',
                  saveStatus === 'saving'
                    ? 'bg-amber-50 text-amber-600'
                    : saveStatus === 'saved'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-600',
                )}
              >
                {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
                {saveStatus === 'saved' && <CheckCircle2 className="h-3 w-3" />}
                {saveStatus === 'error' && <AlertCircle className="h-3 w-3" />}
                <span className="tracking-wider uppercase">
                  {saveStatus === 'saving'
                    ? 'Saving'
                    : saveStatus === 'saved'
                      ? 'Saved to Cloud'
                      : 'Sync Error'}
                </span>
              </div>
              <Separator orientation="vertical" className="h-8" />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-gray-200 text-gray-600"
                onClick={() => window.open(`/academics/lesson-plans/${rawId}/preview`, '_blank')}
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>

              {formData.status === 'draft' ? (
                <Button
                  size="sm"
                  onClick={handlePublishToggle}
                  className="h-9 bg-[#2D9B4E] px-5 font-bold shadow-lg shadow-green-900/10 hover:bg-[#217A3C] active:scale-95"
                >
                  Publish Plan
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handlePublishToggle}
                  variant="outline"
                  className="h-9 border-amber-200 bg-amber-50 font-bold text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                >
                  Revert to Draft
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            <div className="group relative">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-auto border-none bg-transparent px-0 py-1 text-4xl font-black text-gray-900 shadow-none placeholder:text-gray-200 focus-visible:ring-0"
                placeholder="Lesson Title..."
              />
              <div className="absolute -bottom-1 left-0 h-1 w-20 bg-[#2D9B4E]/20 transition-all group-focus-within:w-full group-focus-within:bg-[#2D9B4E]/40" />
            </div>

            <Card className="overflow-hidden border-none shadow-xl ring-1 shadow-gray-200/40 ring-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-3">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                    Lesson Content
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold tracking-tighter uppercase opacity-50"
                >
                  Autosave Enabled
                </Badge>
              </div>
              <div className="bg-white">
                <RichTextEditor
                  content={formData.content || ''}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>
            </Card>
          </div>

          {/* Sidebar (4 cols) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Metadata Card */}
            <Card className="border-none bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-[#2D9B4E]" />
                  <h3 className="text-sm font-bold tracking-wider text-gray-900 uppercase">
                    Plan Details
                  </h3>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-gray-400 uppercase">
                      Subject
                    </Label>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 ring-1 ring-gray-100">
                      {subjects.find((s) => s._id === formData.subjectId)?.name}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-gray-400 uppercase">Grade</Label>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 ring-1 ring-gray-100">
                      {grades.find((g) => g._id === formData.gradeId)?.name}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase">
                    <Clock className="h-3 w-3" />
                    Duration (Minutes)
                  </Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="h-11 border-gray-100 bg-gray-50/50 font-medium focus:bg-white focus:ring-[#2D9B4E]/10"
                    placeholder="e.g. 45"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-gray-400 uppercase">
                    Syllabus Topic Ref
                  </Label>
                  <Input
                    value={formData.syllabusTopicRef}
                    onChange={(e) => setFormData({ ...formData, syllabusTopicRef: e.target.value })}
                    className="h-11 border-gray-100 bg-gray-50/50 font-medium focus:bg-white focus:ring-[#2D9B4E]/10"
                    placeholder="e.g. MOE-MATH-2.1"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase">
                    {formData.visibility === 'school' ? (
                      <Globe className="h-3 w-3" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    Plan Visibility
                  </Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(val) =>
                      setFormData({ ...formData, visibility: val as 'private' | 'school' })
                    }
                  >
                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/50 font-medium focus:bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="private" className="py-2.5 font-medium">
                        Private (Only Me)
                      </SelectItem>
                      <SelectItem value="school" className="py-2.5 font-medium">
                        School (All Teachers)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Resources Card */}
            <Card className="border-none bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-[#2D9B4E]" />
                  <h3 className="text-sm font-bold tracking-wider text-gray-900 uppercase">
                    Resources
                  </h3>
                </div>
                <div>
                  <Label htmlFor="resource-upload" className="cursor-pointer">
                    <div className="flex items-center gap-1.5 rounded-full bg-[#2D9B4E]/10 px-3 py-1 text-[10px] font-bold text-[#2D9B4E] uppercase transition-colors hover:bg-[#2D9B4E]/20">
                      {uploadingResource ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileUp className="h-3 w-3" />
                      )}
                      Upload
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
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center">
                  <div className="mb-3 rounded-full bg-gray-50 p-3">
                    <FileUp className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No resources attached</p>
                  <p className="mt-1 text-xs text-gray-500 italic">
                    Upload PDFs, links, or text docs to assist your teaching.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.resources?.map((res, idx) => {
                    const resolvedUrl =
                      res.url ??
                      (res.storageId ? (storageUrlMap[res.storageId] ?? undefined) : undefined);
                    return (
                      <div
                        key={idx}
                        className="group flex flex-col gap-2 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100 transition-all hover:bg-white hover:shadow-md hover:ring-gray-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-lg shadow-sm',
                                res.type === 'link'
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-red-50 text-red-600',
                              )}
                            >
                              {res.type === 'link' ? (
                                <LinkIcon className="h-4 w-4" />
                              ) : (
                                <FileUp className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex flex-col truncate">
                              <span className="truncate text-sm font-bold text-gray-900">
                                {res.title}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">
                                {res.type}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-100 transition-opacity group-hover:opacity-100 sm:opacity-0">
                            {resolvedUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                              >
                                <a href={resolvedUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-destructive h-8 w-8 text-gray-400 hover:bg-red-50"
                              onClick={() => removeResource(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
