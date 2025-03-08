import { jest } from '@jest/globals';
import { applyPagination } from '../../src/utils/pagination.js';

describe('Pagination Utility', () => {
  let query;

  beforeEach(() => {
    query = {
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });

  test('should apply pagination correctly', () => {
    applyPagination(query, {
      page: 2,
      limit: 10,
      sortBy: 'created_at',
      order: 'desc',
    });

    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.offset).toHaveBeenCalledWith(10); // Page 2 starts at index 10
    expect(query.orderBy).toHaveBeenCalledWith('created_at', 'desc');
  });

  test('should default to page 1 and limit 10 if not provided', () => {
    applyPagination(query, {});

    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.offset).toHaveBeenCalledWith(0);
    expect(query.orderBy).toHaveBeenCalledWith('id', 'desc'); // Default sort
  });

  test('should prevent negative or zero values for page and limit', () => {
    applyPagination(query, { page: -1, limit: 0 });

    expect(query.limit).toHaveBeenCalledWith(10); // Default limit
    expect(query.offset).toHaveBeenCalledWith(0); // Default offset
  });

  test('should allow sorting by a different column', () => {
    applyPagination(query, {
      page: 1,
      limit: 5,
      sortBy: 'title',
      order: 'asc',
    });

    expect(query.orderBy).toHaveBeenCalledWith('title', 'asc'); // Sorting by title
  });

  test('should allow descending sorting order', () => {
    applyPagination(query, {
      page: 1,
      limit: 5,
      sortBy: 'title',
      order: 'desc',
    });

    expect(query.orderBy).toHaveBeenCalledWith('title', 'desc'); // Sorting Z → A
  });
});
