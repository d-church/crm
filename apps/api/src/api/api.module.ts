import { Module } from '@nestjs/common';

import { ActivityModule } from '@/api/activity/activity.module';
import { AuthModule } from '@/api/auth/auth.module';
import { ChurchRoleModule } from '@/api/church-role/church-role.module';
import { CommunityModule } from '@/api/community/community.module';
import { HomeGroupModule } from '@/api/home-group/home-group.module';
import { MinistryModule } from '@/api/ministry/ministry.module';
import { PersonEventModule } from '@/api/person-event/person-event.module';
import { PersonModule } from '@/api/person/person.module';
import { StepModule } from '@/api/step/step.module';
import { TrainingModule } from '@/api/training/training.module';
import { UserModule } from '@/api/user/user.module';

@Module({
  imports: [
    ActivityModule,
    AuthModule,
    ChurchRoleModule,
    CommunityModule,
    HomeGroupModule,
    MinistryModule,
    PersonEventModule,
    PersonModule,
    StepModule,
    TrainingModule,
    UserModule,
  ],
})
export class ApiModule {}
