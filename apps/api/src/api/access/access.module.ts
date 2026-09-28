import { Global, Module } from '@nestjs/common';

import { AccessService } from './access.service';

/**
 * Глобальний навмисно: перевірка доступу має бути під рукою в кожному контролері,
 * інакше зʼявиться спокуса її пропустити.
 */
@Global()
@Module({
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
