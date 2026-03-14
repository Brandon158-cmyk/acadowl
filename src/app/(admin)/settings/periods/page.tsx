'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Loader2,
  PlusCircle,
  Trash2,
  GripVertical,
  Clock,
  Coffee,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
} from 'lucide-react';

interface PeriodItem {
  number: number;
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  isOptional: boolean;
}

export default function PeriodConfigPage() {
  const periodConfig = useQuery(api.schools.periodConfig.getPeriodConfig);
  const updatePeriodConfig = useMutation(api.schools.periodConfig.updatePeriodConfig);
  const seedDefaults = useMutation(api.schools.periodConfig.seedDefaultPeriodConfig);
  const clearConfig = useMutation(api.schools.periodConfig.clearPeriodConfig);

  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync state from server
  useEffect(() => {
    if (periodConfig !== undefined) {
      if (periodConfig) {
        setPeriods(periodConfig.periods);
        setHasChanges(false);
      } else {
        setPeriods([]);
        setHasChanges(false);
      }
    }
  }, [periodConfig]);

  const isLoading = periodConfig === undefined;
  const hasConfig = periodConfig !== null && periodConfig !== undefined;

  const teachingPeriods = periods.filter((p) => !p.isBreak);

  // ── Handlers ──

  const updatePeriod = (index: number, updates: Partial<PeriodItem>) => {
    const updated = [...periods];
    updated[index] = { ...updated[index], ...updates };
    setPeriods(updated);
    setHasChanges(true);
  };

  const addPeriod = () => {
    const lastPeriod = periods[periods.length - 1];
    const newNumber = periods.length + 1;
    const startTime = lastPeriod?.endTime ?? '07:00';

    // Auto-calculate end time (40 min later)
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + 40;
    const endH = Math.floor(totalMin / 60)
      .toString()
      .padStart(2, '0');
    const endM = (totalMin % 60).toString().padStart(2, '0');

    setPeriods([
      ...periods,
      {
        number: newNumber,
        label: `Period ${teachingPeriods.length + 1}`,
        startTime,
        endTime: `${endH}:${endM}`,
        isBreak: false,
        isOptional: false,
      },
    ]);
    setHasChanges(true);
  };

  const addBreak = () => {
    const lastPeriod = periods[periods.length - 1];
    const newNumber = periods.length + 1;
    const startTime = lastPeriod?.endTime ?? '09:20';

    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + 20;
    const endH = Math.floor(totalMin / 60)
      .toString()
      .padStart(2, '0');
    const endM = (totalMin % 60).toString().padStart(2, '0');

    setPeriods([
      ...periods,
      {
        number: newNumber,
        label: 'Break',
        startTime,
        endTime: `${endH}:${endM}`,
        isBreak: true,
        isOptional: false,
      },
    ]);
    setHasChanges(true);
  };

  const removePeriod = (index: number) => {
    const updated = periods.filter((_, i) => i !== index);
    // Re-number
    const renumbered = updated.map((p, i) => ({ ...p, number: i + 1 }));
    setPeriods(renumbered);
    setHasChanges(true);
  };

  const movePeriod = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= periods.length) return;
    const updated = [...periods];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    const renumbered = updated.map((p, i) => ({ ...p, number: i + 1 }));
    setPeriods(renumbered);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePeriodConfig({
        periodsPerDay: teachingPeriods.length,
        periods,
      });
      toast.success('Period configuration saved successfully.');
      setHasChanges(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save period configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await seedDefaults();
      toast.success('Default Zambian school period structure loaded.');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to seed defaults.');
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearConfig();
      toast.success('Period configuration cleared.');
      setShowClearDialog(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to clear configuration.');
    } finally {
      setClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <PageHeader
        title="Period Configuration"
        description="Define the daily period structure for your school. This determines the timetable grid layout."
      >
        {hasConfig && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </PageHeader>

      {/* Empty state — no config yet */}
      {!hasConfig && periods.length === 0 && (
        <Card className="border-none bg-white shadow-sm ring-1 ring-gray-100">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D9B4E]/10">
              <Clock className="h-8 w-8 text-[#2D9B4E]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">No period structure configured</h3>
              <p className="max-w-md text-sm text-gray-500">
                Set up your school&apos;s daily period structure before building timetables. You can
                start with the standard Zambian school day or build your own.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="h-11 bg-[#2D9B4E] px-6 font-semibold hover:bg-[#217A3C]"
              >
                {seeding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Load Default Schedule
              </Button>
              <Button
                variant="outline"
                onClick={addPeriod}
                className="h-11 px-6 font-semibold"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Build From Scratch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period list */}
      {(hasConfig || periods.length > 0) && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {teachingPeriods.length} teaching period{teachingPeriods.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {periods.filter((p) => p.isBreak).length} break
                {periods.filter((p) => p.isBreak).length !== 1 ? 's' : ''}
              </span>
            </div>
            {periods.length > 0 && (
              <>
                <div className="h-4 w-px bg-gray-200" />
                <span className="text-sm text-gray-500">
                  {periods[0].startTime} – {periods[periods.length - 1].endTime}
                </span>
              </>
            )}
          </div>

          {/* Period rows */}
          <Card className="border-none bg-white shadow-sm ring-1 ring-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                Daily Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {periods.map((period, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    period.isBreak
                      ? 'border-amber-100 bg-amber-50/50'
                      : period.isOptional
                        ? 'border-blue-100 bg-blue-50/30'
                        : 'border-gray-100 bg-white hover:bg-gray-50/50'
                  }`}
                >
                  {/* Drag handle placeholder + number */}
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="h-4 w-4 text-gray-300" />
                    <span className="w-6 text-center text-xs font-bold text-gray-400">
                      {period.number}
                    </span>
                  </div>

                  {/* Label */}
                  <Input
                    value={period.label}
                    onChange={(e) => updatePeriod(index, { label: e.target.value })}
                    className="h-9 w-40 rounded-lg border-gray-100 bg-transparent text-sm font-medium"
                    placeholder="Period label"
                  />

                  {/* Start time */}
                  <Input
                    type="time"
                    value={period.startTime}
                    onChange={(e) => updatePeriod(index, { startTime: e.target.value })}
                    className="h-9 w-28 rounded-lg border-gray-100 bg-transparent text-center text-sm"
                  />

                  <span className="text-xs text-gray-300">→</span>

                  {/* End time */}
                  <Input
                    type="time"
                    value={period.endTime}
                    onChange={(e) => updatePeriod(index, { endTime: e.target.value })}
                    className="h-9 w-28 rounded-lg border-gray-100 bg-transparent text-center text-sm"
                  />

                  {/* Break toggle */}
                  <div className="flex items-center gap-1.5">
                    <Switch
                      id={`break-${index}`}
                      checked={period.isBreak}
                      onCheckedChange={(checked) => updatePeriod(index, { isBreak: checked })}
                      className="scale-90"
                    />
                    <Label htmlFor={`break-${index}`} className="cursor-pointer text-xs text-gray-500">
                      Break
                    </Label>
                  </div>

                  {/* Optional toggle */}
                  {!period.isBreak && (
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id={`optional-${index}`}
                        checked={period.isOptional}
                        onCheckedChange={(checked) => updatePeriod(index, { isOptional: checked })}
                        className="scale-90"
                      />
                      <Label
                        htmlFor={`optional-${index}`}
                        className="cursor-pointer text-xs text-gray-500"
                      >
                        Optional
                      </Label>
                    </div>
                  )}

                  {/* Move + Delete */}
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-gray-700"
                      onClick={() => movePeriod(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-gray-700"
                      onClick={() => movePeriod(index, 'down')}
                      disabled={index === periods.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-600"
                      onClick={() => removePeriod(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPeriod}
                  className="h-9 border-dashed border-gray-200 text-gray-500 hover:border-[#2D9B4E]/30 hover:text-[#2D9B4E]"
                >
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  Add Period
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBreak}
                  className="h-9 border-dashed border-amber-200 text-amber-600 hover:border-amber-300 hover:bg-amber-50"
                >
                  <Coffee className="mr-1.5 h-3.5 w-3.5" />
                  Add Break
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end gap-3">
            {hasChanges && (
              <span className="flex items-center text-sm text-amber-600">Unsaved changes</span>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges || periods.length === 0}
              className="h-11 bg-[#2D9B4E] px-8 font-semibold hover:bg-[#217A3C]"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Configuration
            </Button>
          </div>
        </>
      )}

      {/* Clear confirmation dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogTitle>Reset Period Configuration?</DialogTitle>
          <DialogDescription>
            This will remove all period settings. You can re-configure or load defaults afterwards.
            This action is blocked if timetable slots already exist.
          </DialogDescription>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={clearing}
            >
              {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
