import { Request } from 'express';
import { PaginationQuery } from '../types/api';

const LIMIT_DEFAUT = 25;
const LIMIT_MAX = 200;

/** Lit `?page=&limit=` en bornant `limit` — une limite non bornée est un vecteur de déni de service. */
export function lirePagination(req: Request): PaginationQuery {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limitDemande = Number(req.query.limit) || LIMIT_DEFAUT;
  const limit = Math.min(Math.max(1, limitDemande), LIMIT_MAX);

  return { page, limit, offset: (page - 1) * limit };
}

export function construireReponsePaginee<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationQuery,
) {
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
