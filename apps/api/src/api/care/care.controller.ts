import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AccessService } from '@/api/access/access.service';
import type { Viewer } from '@/api/access/visibility';
import type { Actor } from '@/api/activity/activity.service';
import { Authorization, CurrentActor, CurrentViewer } from '@/common/decorators';
import { Role } from '@/infra/prisma/prisma.service';

import { CareService } from './care.service';
import { CreateCareDto } from './dto/care.dto';

@ApiTags('Care')
@Controller('people/:personId/cares')
export class CareController {
  constructor(
    private readonly careService: CareService,
    private readonly accessService: AccessService,
  ) {}

  /** Імена попечителів бачить кожен, хто бачить людину: інакше нема до кого йти з сигналом. */
  @Authorization()
  @ApiOperation({ summary: 'Попечителі людини — діючі й колишні' })
  @Get()
  public async findForPerson(@Param('personId') personId: string, @CurrentViewer() viewer: Viewer) {
    await this.accessService.assertVisible(personId, viewer);

    return this.careService.findForPerson(personId);
  }

  /** Доступ до душі не беруть самі: призначає пастор або адмін. */
  @Authorization(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Призначити попечителя' })
  @Post()
  public create(
    @Param('personId') personId: string,
    @Body() dto: CreateCareDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.careService.create(personId, dto, actor);
  }

  @Authorization(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Завершити опіку — запис лишається історією' })
  @Delete(':id')
  public close(
    @Param('personId') personId: string,
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ) {
    return this.careService.close(personId, id, actor);
  }
}
