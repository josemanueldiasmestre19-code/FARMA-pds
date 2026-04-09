export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded-lg ${className}`} />
  )
}

export function MedicineCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    </div>
  )
}
