// Zajednicke skeleton komponente - zamjena za "Učitavanje..." tekst/spinner
// svuda kroz aplikaciju (Dok. checklist: "Loading - svuda skeleton, ne spinner").

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

/** Generička kartica sa par linija teksta - za mobilni prikaz liste ili jednostavne detalj-stranice. */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
      <Bar className="h-4 w-2/3" />
      <Bar className="h-3 w-1/2" />
      <Bar className="h-3 w-1/3" />
    </div>
  );
}

/** Skeleton za tabelarni red (desktop). */
function SkeletonTableRow({ columns }: { columns: number }) {
  return (
    <tr className="border-t border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Bar className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

interface SkeletonListPageProps {
  rows?: number;
  columns?: number;
}

/**
 * Skeleton za standardnu "lista" stranicu ovog projekta - mobilni prikaz su
 * kartice, desktop je tabela (isti obrazac kao Customers/Services/Employees/
 * Appointments/Users/AdminPanel...). Zamjenjuje cijeli {loading ? ... : ...} blok.
 */
export function SkeletonListPage({ rows = 5, columns = 5 }: SkeletonListPageProps) {
  return (
    <>
      {/* Mobilni prikaz */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Desktop prikaz */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full">
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Skeleton za red stat-kartica (npr. Dashboard, DashboardAdmin). */
export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-5 shadow-sm space-y-3">
          <Bar className="h-3 w-1/2" />
          <Bar className="h-7 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Nekoliko generickih kartica jedna ispod druge - za jednostavnije/detalj stranice. */
export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default Bar;
