import { jest } from '@jest/globals';
import db from '../../src/config/db.js';
import { applyPagination } from '../../src/utils/pagination.js';

beforeEach(async () => {
  await db('articles').del();
});

afterAll(async () => {
  await db('articles').del();
  await db.destroy();
});

describe('Pagination Utility', () => {
  test('should apply pagination correctly', () => {
    const query = {
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    const page = 2;
    const limit = 10;
    const sortBy = 'created_at';
    const order = 'desc';

    applyPagination(query, { page, limit, sortBy, order });

    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.offset).toHaveBeenCalledWith(10); // Page 2 starts at index 10
    expect(query.orderBy).toHaveBeenCalledWith('created_at', 'desc');
  });

  test('should default to page 1 and limit 10 if not provided', () => {
    const query = {
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    applyPagination(query, {});

    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.offset).toHaveBeenCalledWith(0);
    expect(query.orderBy).toHaveBeenCalledWith('id', 'desc'); // Default sort
  });

  test('should prevent negative or zero values for page and limit', () => {
    const query = {
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    applyPagination(query, { page: -1, limit: 0 });

    expect(query.limit).toHaveBeenCalledWith(10); // Default limit
    expect(query.offset).toHaveBeenCalledWith(0); // Default offset
  });
});
