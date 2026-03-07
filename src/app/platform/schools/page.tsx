'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Building2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function PlatformSchoolsPage() {
  const schools = useQuery(api.schools.queries.getAllSchools);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Schools" description="Manage all schools on the EduZambia platform.">
        <Link href="/schools/new" className={buttonVariants({ variant: 'default' })}>
          <Plus className="mr-2 h-4 w-4" />
          Add School
        </Link>
      </PageHeader>

      {schools === undefined ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      ) : schools.length === 0 ? (
        <div className="border-border rounded-lg border-2 border-dashed p-12 text-center">
          <Building2 className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50" />
          <h3 className="text-foreground text-lg font-medium">No schools yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Create your first school to get started.
          </p>
          <Link href="/schools/new" className={buttonVariants({ variant: 'default' })}>
            <Plus className="mr-2 h-4 w-4" />
            Add School
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {schools.map((school) => (
            <Card key={school._id}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{school.name}</h3>
                    <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                      {school.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {school.subscriptionTier}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex gap-4 text-sm">
                    <span>{school.slug}.eduzambia.zm</span>
                    <span>•</span>
                    <span className="capitalize">{school.type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>
                      {school.district}, {school.province}
                    </span>
                  </div>
                </div>
                <a
                  href={`http://${school.slug}.localhost:3000`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Visit Portal
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
