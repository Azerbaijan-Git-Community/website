export function LeaderboardSkeleton() {
  return (
    <div className="w-full">
      {/* Desktop Table Skeleton */}
      <div className="hidden lg:block">
        <div className="glass overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-[rgba(48,54,61,0.5)]">
                <th className="px-6 py-4 text-left font-outfit text-sm font-semibold tracking-wider text-lo uppercase">
                  Rank
                </th>
                <th className="px-6 py-4 text-left font-outfit text-sm font-semibold tracking-wider text-lo uppercase">
                  Contributor
                </th>
                <th className="px-6 py-4 text-right font-outfit text-sm font-semibold tracking-wider text-lo uppercase">
                  Monthly
                </th>
                <th className="px-6 py-4 text-right font-outfit text-sm font-semibold tracking-wider text-lo uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, index) => (
                <tr key={index} className="border-b border-line">
                  <td className="px-6 py-4">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-surface" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-surface ring-2 ring-line" />
                      <div className="h-5 w-32 animate-pulse rounded bg-surface" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="ml-auto h-6 w-20 animate-pulse rounded bg-surface" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="ml-auto h-6 w-24 animate-pulse rounded bg-surface" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="glass relative overflow-hidden rounded-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            {/* Rank Badge Skeleton - Top Right */}
            <div className="absolute top-4 right-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-surface" />
            </div>

            {/* User Info Skeleton */}
            <div className="mb-4 flex items-center gap-3">
              <div className="h-14 w-14 animate-pulse rounded-full bg-surface ring-2 ring-line" />
              <div className="flex-1">
                <div className="mb-2 h-5 w-32 animate-pulse rounded bg-surface" />
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="flex justify-between gap-4">
              <div className="flex-1 rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-3">
                <div className="mb-2 h-3 w-16 animate-pulse rounded bg-surface" />
                <div className="h-6 w-20 animate-pulse rounded bg-surface" />
              </div>
              <div className="flex-1 rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-3">
                <div className="mb-2 h-3 w-16 animate-pulse rounded bg-surface" />
                <div className="h-6 w-20 animate-pulse rounded bg-surface" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
