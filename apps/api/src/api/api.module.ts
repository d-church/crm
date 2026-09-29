import { Module } from '@nestjs/common';

import { AccessModule } from '@/api/access/access.module';
import { ActivityModule } from '@/api/activity/activity.module';
import { AuthModule } from '@/api/auth/auth.module';
import { CareModule } from '@/api/care/care.module';
import { ChurchRoleModule } from '@/api/church-role/church-role.module';
import { CommunityModule } from '@/api/community/community.module';
import { ConnectModule } from '@/api/connect/connect.module';
import { EventTypeModule } from '@/api/event-type/event-type.module';
import { GatheringModule } from '@/api/gathering/gathering.module';
import { GatheringTypeModule } from '@/api/gathering-type/gathering-type.module';
import { HomeGroupModule } from '@/api/home-group/home-group.module';
import { MinistryModule } from '@/api/ministry/ministry.module';
import { OverviewModule } from '@/api/overview/overview.module';
import { PersonEventModule } from '@/api/person-event/person-event.module';
import { PersonModule } from '@/api/person/person.module';
import { StepModule } from '@/api/step/step.module';
import { StructureModule } from '@/api/structure/structure.module';
import { TrainingModule } from '@/api/training/training.module';
import { UserModule } from '@/api/user/user.module';

@Module({
  imports: [
    AccessModule,
    ActivityModule,
    AuthModule,
    CareModule,
    ChurchRoleModule,
    CommunityModule,
    ConnectModule,
    EventTypeModule,
    GatheringModule,
    GatheringTypeModule,
    HomeGroupModule,
    MinistryModule,
    OverviewModule,
    PersonEventModule,
    PersonModule,
    StepModule,
    StructureModule,
    TrainingModule,
    UserModule,
  ],
})
export class ApiModule {}
