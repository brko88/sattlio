interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-4 text-sm">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
      >
        Prethodna
      </button>
      <span className="text-slate-500">
        Strana {page} od {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
      >
        Sljedeća
      </button>
    </div>
  );
}

export default Pagination;
