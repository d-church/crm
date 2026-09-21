import { PickType } from '@nestjs/swagger';

import { FindPeopleDto } from './find-people.dto';

export class PeopleStatsDto extends PickType(FindPeopleDto, ['includeInactive'] as const) {}
