import React from 'react';

import { cn } from '../../utils';

const DataTable = ({ columns, data, isLoading, className }) => {
  return (
    <div
      className={cn('relative overflow-x-auto border rounded-lg', className)}
    >
      <table className="w-full text-sm text-right text-foreground">
        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className="px-6 py-3 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, ridx) => (
              <tr key={ridx} className="animate-pulse">
                {columns.map((_, cidx) => (
                  <td key={cidx} className="px-6 py-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length > 0 ? (
            data.map((row, ridx) => (
              <tr
                key={ridx}
                className="bg-white dark:bg-slate-950 hover:bg-muted/30 transition-colors"
              >
                {columns.map((col, cidx) => (
                  <td key={cidx} className="px-6 py-4 whitespace-nowrap">
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-10 text-center text-muted-foreground"
              >
                لا يوجد بيانات للعرض
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
