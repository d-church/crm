import { BadRequestException } from '@nestjs/common';

import { PagePipe } from './page.pipe';

describe('PagePipe', () => {
  const pipe = new PagePipe();

  it('defaults to the first page when nothing is passed', () => {
    expect(pipe.transform(undefined)).toBe(1);
    expect(pipe.transform(null)).toBe(1);
    expect(pipe.transform('')).toBe(1);
  });

  it('parses a positive integer', () => {
    expect(pipe.transform('3')).toBe(3);
  });

  it('rejects a page below the first one', () => {
    expect(() => pipe.transform('0')).toThrow(BadRequestException);
    expect(() => pipe.transform('-2')).toThrow(BadRequestException);
  });

  it('rejects anything that is not an integer', () => {
    expect(() => pipe.transform('1.5')).toThrow(BadRequestException);
    expect(() => pipe.transform('abc')).toThrow(BadRequestException);
    expect(() => pipe.transform(2)).toThrow(BadRequestException);
  });
});
