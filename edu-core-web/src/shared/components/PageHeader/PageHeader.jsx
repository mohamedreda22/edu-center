import React from 'react';

import { cn } from '../../utils';

const PageHeader = ({ title, description, children, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8',
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
};

export default PageHeader;
