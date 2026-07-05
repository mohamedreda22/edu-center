import { PackageOpen } from 'lucide-react';
import React from 'react';

import { Button } from '../ui/button';

const EmptyState = ({
  title = 'لا يوجد بيانات',
  description = 'لم يتم العثور على أي سجلات مطابقة.',
  icon: Icon = PackageOpen,
  action,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 border-2 border-dashed rounded-xl space-y-4">
      <div className="p-3 bg-muted rounded-full">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {description}
        </p>
      </div>
      {action && <Button onClick={onAction}>{action}</Button>}
    </div>
  );
};

export default EmptyState;
