export class PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(total: number, page: number, limit: number) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMetaDto;

  private constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }

  static create<T>(data: T[], total: number, page: number, limit: number): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(data, new PaginationMetaDto(total, page, limit));
  }
}
