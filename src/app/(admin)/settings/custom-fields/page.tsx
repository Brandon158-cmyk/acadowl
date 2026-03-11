'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useSchool } from '@/hooks/useSchool';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { Doc } from '../../../../../convex/_generated/dataModel';

type CustomField = Doc<'schools'>['customStudentFields'][number];

export default function CustomFieldsSettingsPage() {
  const { school, isLoading: isSchoolLoading } = useSchool();
  const updateCustomFields = useMutation(api.schools.mutations.updateCustomStudentFields);

  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<CustomField[]>([]);

  useEffect(() => {
    if (school && school.customStudentFields) {
      setFields(school.customStudentFields);
    }
  }, [school]);

  if (isSchoolLoading || !school) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleAddField = () => {
    if (fields.length >= 20) {
      toast.error('Maximum of 20 custom fields allowed.');
      return;
    }
    setFields([
      ...fields,
      {
        key: `custom_${Date.now()}`,
        label: 'New Field',
        type: 'text',
        required: false,
      } as CustomField,
    ]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleUpdateField = (index: number, updates: Partial<CustomField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates } as CustomField;
    setFields(newFields);
  };

  const handleSubmit = async () => {
    // Validate empty labels
    const hasEmptyLabels = fields.some((f) => !f.label.trim());
    if (hasEmptyLabels) {
      toast.error('All fields must have a valid label.');
      return;
    }

    setLoading(true);
    try {
      await updateCustomFields({ fields });
      toast.success('Custom student fields updated successfully.');
    } catch (error) {
      toast.error('Failed to update custom fields.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Student Fields"
        description="Add additional tracking fields to the student enrolment form and profile."
      >
        <Button onClick={handleAddField} variant="outline" disabled={fields.length >= 20}>
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </PageHeader>

      <div className="max-w-4xl space-y-4">
        {fields.length === 0 ? (
          <Card className="bg-muted/20 border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No custom fields defined yet. Click "Add Field" to create one.
            </p>
          </Card>
        ) : (
          fields.map((field, index) => (
            <Card key={field.key} className="group relative">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-4 md:flex-row md:items-end">
                  <div className="w-full flex-1 space-y-2">
                    <Label>Field Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                      placeholder="e.g. Previous School Province"
                    />
                  </div>

                  <div className="w-full space-y-2 md:w-32">
                    <Label>Type</Label>
                    <select
                      className="border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.type}
                      onChange={(e) => handleUpdateField(index, { type: e.target.value as any })}
                    >
                      <option value="text">Text</option>
                      <option value="boolean">Yes/No</option>
                      <option value="date">Date</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>

                  {field.type === 'select' && (
                    <div className="w-full flex-2 space-y-2">
                      <Label>Options (comma separated)</Label>
                      <Input
                        value={field.options?.join(', ') || ''}
                        onChange={(e) =>
                          handleUpdateField(index, {
                            options: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}

                  <div className="flex h-9 w-full items-center space-x-2 md:w-auto">
                    <Switch
                      id={`req-${field.key}`}
                      checked={field.required}
                      onCheckedChange={(checked) => handleUpdateField(index, { required: checked })}
                    />
                    <Label htmlFor={`req-${field.key}`}>Required</Label>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive ms-auto mt-2 md:mt-0"
                    onClick={() => handleRemoveField(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
