import React from 'react';

const SkeletonPrimitive = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
);

/**
 * Muestra un esqueleto de carga para tarjetas.
 */
export const CardSkeleton = ({ count = 1 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <SkeletonPrimitive className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <SkeletonPrimitive className="h-4 w-3/4" />
              <SkeletonPrimitive className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Muestra un esqueleto de carga para tablas.
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <SkeletonPrimitive className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <SkeletonPrimitive className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
