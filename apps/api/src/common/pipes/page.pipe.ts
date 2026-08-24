import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PagePipe implements PipeTransform<unknown, number> {
  private readonly DEFAULT_PAGE = 1;

  public transform(value: unknown): number {
    if (value === undefined || value === null || value === '') {
      return this.DEFAULT_PAGE;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('page must be an integer number');
    }

    const page = Number(value);

    if (!Number.isInteger(page)) {
      throw new BadRequestException('page must be an integer number');
    }

    if (page < this.DEFAULT_PAGE) {
      throw new BadRequestException(`page must not be less than ${this.DEFAULT_PAGE}`);
    }

    return page;
  }
}
