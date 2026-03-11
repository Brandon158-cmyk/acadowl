'use client';

import { Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export function PlatformTopbar() {
  return (
    <header className="bg-background border-border flex h-14 items-center gap-4 border-b px-4 md:px-6">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-sm font-semibold">EduZambia Platform Control</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border-r pr-4">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-muted-foreground text-sm font-medium">Super Admin Mode</span>
        </div>
      </div>
    </header>
  );
}
