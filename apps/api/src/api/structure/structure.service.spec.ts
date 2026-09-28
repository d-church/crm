import { ForbiddenException } from '@nestjs/common';

import type { Viewer } from '@/api/access/visibility';
import { Role, type PrismaService } from '@/infra/prisma/prisma.service';

import { StructureService } from './structure.service';

const viewer = (roles: Role[]): Viewer => ({ id: 'u', personId: null, roles, scopes: [] });

const findAssignments = jest.fn().mockResolvedValue([]);

const prisma = {
  community: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
  homeGroup: { findUnique: jest.fn().mockResolvedValue({ id: 'g1' }) },
  ministry: { findUnique: jest.fn().mockResolvedValue({ id: 'm1' }) },
  training: { findUnique: jest.fn().mockResolvedValue({ id: 't1' }) },
  person: { findMany: jest.fn().mockResolvedValue([]) },
  ministryAssignment: { findMany: findAssignments },
} as unknown as PrismaService;

const service = new StructureService(prisma);

describe('StructureService', () => {
  it('показує структуру лідеру', async () => {
    await expect(service.peopleOf('community', 'c1', viewer([Role.LEADER]))).resolves.toEqual([]);
  });

  it('не показує структуру служителю конекту', async () => {
    await expect(service.peopleOf('community', 'c1', viewer([Role.CONNECT]))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('показує структуру тому, хто і в конекті, і лідер', async () => {
    await expect(
      service.peopleOf('community', 'c1', viewer([Role.CONNECT, Role.LEADER])),
    ).resolves.toEqual([]);
  });

  it('не показує структуру користувачу без ролей', async () => {
    await expect(service.peopleOf('community', 'c1', viewer([]))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('у служінні бере лише діючі участі', async () => {
    await service.peopleOf('ministry', 'm1', viewer([Role.ADMIN]));

    expect(findAssignments).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ministryId: 'm1', until: null } }),
    );
  });
});
