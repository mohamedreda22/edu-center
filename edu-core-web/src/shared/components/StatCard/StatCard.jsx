import React from 'react';

import { cn } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  className,
}) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(trend || trendValue) && (
          <p
            className={cn(
              'text-xs mt-1 font-medium',
              trend === 'up'
                ? 'text-green-600'
                : trend === 'down'
                  ? 'text-red-600'
                  : 'text-muted-foreground'
            )}
          >
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
