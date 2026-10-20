import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

/**
 * Сегмент бази: уся церква, одне відгалуження або все, що поза відгалуженнями.
 *
 * D.Youth — фактично церква в церкві, тож на ті самі списки й цифри треба вміти
 * дивитися трьома способами. `undefined` означає «без звуження» — так Prisma
 * отримує запит без зайвого `AND`.
 */
export const segmentWhere = async (
  prismaService: PrismaService,
  segment?: string,
): Promise<Prisma.PersonWhereInput | undefined> => {
  if (segment === undefined || segment === 'all') return undefined;

  if (segment === 'rest') {
    const branches = await prismaService.community.findMany({
      where: { isBranch: true },
      select: { id: true },
    });

    return branches.length === 0
      ? undefined
      : { NOT: { communities: { some: { id: { in: branches.map(({ id }) => id) } } } } };
  }

  return { communities: { some: { id: segment } } };
};
