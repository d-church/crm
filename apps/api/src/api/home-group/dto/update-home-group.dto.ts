import { PartialType } from '@nestjs/swagger';

import { CreateHomeGroupDto } from './create-home-group.dto';

export class UpdateHomeGroupDto extends PartialType(CreateHomeGroupDto) {}
