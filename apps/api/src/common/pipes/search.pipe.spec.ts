import { BadRequestException } from '@nestjs/common';

import { SearchPipe } from './search.pipe';

describe('SearchPipe', () => {
  const pipe = new SearchPipe();

  it('treats an empty search as no search at all', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
    expect(pipe.transform(null)).toBeUndefined();
    expect(pipe.transform('   ')).toBeUndefined();
  });

  it('trims the query', () => {
    expect(pipe.transform('  піца  ')).toBe('піца');
  });

  it('escapes LIKE wildcards so they match literally', () => {
    expect(pipe.transform('50%')).toBe('50\\%');
    expect(pipe.transform('a_b')).toBe('a\\_b');
    expect(pipe.transform('back\\slash')).toBe('back\\\\slash');
  });

  it('rejects a query longer than the limit', () => {
    expect(() => pipe.transform('a'.repeat(101))).toThrow(BadRequestException);
  });

  it('rejects a non-string query', () => {
    expect(() => pipe.transform(42)).toThrow(BadRequestException);
  });
});
