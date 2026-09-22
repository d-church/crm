import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { CommunityModule } from '@/api/community/community.module';
import { HomeGroupModule } from '@/api/home-group/home-group.module';
import { MinistryModule } from '@/api/ministry/ministry.module';
import { PersonModule } from '@/api/person/person.module';
import { StepModule } from '@/api/step/step.module';
import { TrainingModule } from '@/api/training/training.module';
import { UserModule } from '@/api/user/user.module';

@Module({
  imports: [
    AuthModule,
    CommunityModule,
    HomeGroupModule,
    MinistryModule,
    PersonModule,
    StepModule,
    TrainingModule,
    UserModule,
  ],
})
export class ApiModule {}
