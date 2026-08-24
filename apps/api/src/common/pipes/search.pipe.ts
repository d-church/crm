import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SearchPipe implements PipeTransform<unknown, string | undefined> {
  private readonly MAX_SEARCH_LENGTH = 100;
  public transform(value: unknown): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value !== 'string') {
      throw new BadRequestException('search must be a string');
    }

    const search = value.trim();
    if (!search) {
      return undefined;
    }

    if (search.length > this.MAX_SEARCH_LENGTH) {
      throw new BadRequestException(
        `search must be shorter than or equal to ${this.MAX_SEARCH_LENGTH} characters`,
      );
    }

    return this.convertToEscapeLikePattern(search);
  }

  private convertToEscapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, '\\$&');
  }
}
