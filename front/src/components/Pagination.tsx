import type { Pagination as PaginationInfo } from '@/types/api';

interface Props {
  pagination: PaginationInfo;
  onChangePage: (page: number) => void;
}

export function Pagination({ pagination, onChangePage }: Props) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => onChangePage(page - 1)} disabled={page <= 1}>
        ← Précédent
      </button>
      <span className="pagination__info">
        Page {page} / {totalPages} <span className="pagination__total">({total} résultats)</span>
      </span>
      <button type="button" onClick={() => onChangePage(page + 1)} disabled={page >= totalPages}>
        Suivant →
      </button>
    </nav>
  );
}
