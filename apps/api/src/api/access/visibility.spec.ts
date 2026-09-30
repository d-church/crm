import { CareOrigin, Role } from '@/infra/prisma/prisma.service';

import {
  boardWhere,
  gatheringWhere,
  narrow,
  NOBODY,
  scopeWhere,
  visibilityFor,
  type Viewer,
  type ViewerScope,
} from './visibility';

const PERSON_ID = '00000000-0000-4000-8000-0000000000aa';
const COMMUNITY_ID = '00000000-0000-4000-8000-000000000001';
const HOME_GROUP_ID = '00000000-0000-4000-8000-000000000002';
const MINISTRY_ID = '00000000-0000-4000-8000-000000000003';

const scope = (patch: Partial<ViewerScope>): ViewerScope => ({
  communityId: null,
  homeGroupId: null,
  ministryId: null,
  trainingId: null,
  ...patch,
});

const viewer = (patch: Partial<Viewer> = {}): Viewer => ({
  id: 'user-1',
  personId: PERSON_ID,
  roles: [],
  scopes: [],
  ...patch,
});

const CARE = { careReceived: { some: { caregiverId: PERSON_ID, until: null } } };

describe('visibilityFor', () => {
  it('віддає всю базу суперадміну — але не пасторський шар', () => {
    expect(visibilityFor(viewer({ roles: [Role.SUPERADMIN] }))).toEqual({
      rows: undefined,
      pastoral: CARE,
    });
  });

  it('віддає всю базу адміну без жодної області — без пасторського шару', () => {
    expect(visibilityFor(viewer({ roles: [Role.ADMIN] }))).toEqual({
      rows: undefined,
      pastoral: CARE,
    });
  });

  it('відкриває пасторський шар по всій церкві лише з роллю пастора', () => {
    expect(visibilityFor(viewer({ roles: [Role.ADMIN, Role.PASTOR] }))).toEqual({
      rows: undefined,
      pastoral: undefined,
    });
  });

  it('не лишає пасторського шару адміну без звʼязку з людиною', () => {
    expect(visibilityFor(viewer({ roles: [Role.ADMIN], personId: null }))).toEqual({
      rows: undefined,
      pastoral: NOBODY,
    });
  });

  it('не показує нічого користувачу без ролей', () => {
    expect(visibilityFor(viewer())).toEqual({ rows: NOBODY, pastoral: NOBODY });
  });

  it('замикає адміна спільноти на його спільноту, а пасторський шар — на підопічних', () => {
    const result = visibilityFor(
      viewer({ roles: [Role.ADMIN], scopes: [scope({ communityId: COMMUNITY_ID })] }),
    );

    expect(result.rows).toEqual({
      OR: [CARE, { communities: { some: { id: { in: [COMMUNITY_ID] } } } }],
    });
    expect(result.pastoral).toEqual(CARE);
  });

  it('відкриває пастору область цілком, нікого до неї не додаючи', () => {
    const rows = {
      OR: [CARE, { communities: { some: { id: { in: [COMMUNITY_ID] } } } }],
    };
    const result = visibilityFor(
      viewer({
        roles: [Role.ADMIN, Role.PASTOR],
        scopes: [scope({ communityId: COMMUNITY_ID })],
      }),
    );

    expect(result.rows).toEqual(rows);
    expect(result.pastoral).toEqual(rows);
  });

  it('дає пастору без інших ролей лише підопічних', () => {
    expect(visibilityFor(viewer({ roles: [Role.PASTOR] }))).toEqual({
      rows: CARE,
      pastoral: CARE,
    });
  });

  it('не розширює пастором області, яких не давали', () => {
    expect(
      visibilityFor(
        viewer({ roles: [Role.PASTOR], scopes: [scope({ communityId: COMMUNITY_ID })] }),
      ).rows,
    ).toEqual(CARE);
  });

  it('дає лідеру командний шар за областю, а пасторський — лише над підопічними', () => {
    const result = visibilityFor(
      viewer({ roles: [Role.LEADER], scopes: [scope({ ministryId: MINISTRY_ID })] }),
    );

    expect(result.rows).toEqual({
      OR: [
        CARE,
        { ministryAssignments: { some: { ministryId: { in: [MINISTRY_ID] }, until: null } } },
      ],
    });
    expect(result.pastoral).toEqual(CARE);
  });

  it('лишає лідера ні з чим, поки йому нічого не довірили', () => {
    expect(visibilityFor(viewer({ roles: [Role.LEADER], personId: null }))).toEqual({
      rows: NOBODY,
      pastoral: NOBODY,
    });
  });

  it('показує конекту борду, а не всю спільноту', () => {
    const result = visibilityFor(
      viewer({ roles: [Role.CONNECT], scopes: [scope({ communityId: COMMUNITY_ID })] }),
    );

    expect(result.rows).toEqual({
      OR: [
        CARE,
        {
          communities: { some: { id: { in: [COMMUNITY_ID] } } },
          careReceived: {
            some: { origin: CareOrigin.CONNECT, caregiverId: PERSON_ID, until: null },
          },
        },
      ],
    });
    expect(result.pastoral).toEqual(CARE);
  });

  it('складає дві ролі: лідер домашки, який служить ще й у конекті', () => {
    const result = visibilityFor(
      viewer({
        roles: [Role.LEADER, Role.CONNECT],
        scopes: [scope({ homeGroupId: HOME_GROUP_ID }), scope({ communityId: COMMUNITY_ID })],
      }),
    );

    expect(result.rows).toEqual({
      OR: [
        CARE,
        {
          OR: [
            { communities: { some: { id: { in: [COMMUNITY_ID] } } } },
            { homeGroupId: { in: [HOME_GROUP_ID] } },
          ],
        },
        {
          communities: { some: { id: { in: [COMMUNITY_ID] } } },
          careReceived: {
            some: { origin: CareOrigin.CONNECT, caregiverId: PERSON_ID, until: null },
          },
        },
      ],
    });
  });
});

describe('scopeWhere', () => {
  it('не бачить колишніх учасників служіння', () => {
    expect(scopeWhere([scope({ ministryId: MINISTRY_ID })])).toEqual({
      ministryAssignments: { some: { ministryId: { in: [MINISTRY_ID] }, until: null } },
    });
  });

  it('повертає null, коли областей немає', () => {
    expect(scopeWhere([])).toBeNull();
  });
});

describe('boardWhere', () => {
  it('тримається лише спільнот: домашня група бордою не є', () => {
    expect(boardWhere(viewer({ scopes: [scope({ homeGroupId: HOME_GROUP_ID })] }))).toBeNull();
  });

  it('лишає служителю лише тих, кого він привів сам', () => {
    expect(boardWhere(viewer({ scopes: [scope({ communityId: COMMUNITY_ID })] }))).toEqual({
      communities: { some: { id: { in: [COMMUNITY_ID] } } },
      careReceived: {
        some: { origin: CareOrigin.CONNECT, caregiverId: PERSON_ID, until: null },
      },
    });
  });

  it('порожня, поки облікового запису не звʼязано з людиною', () => {
    expect(
      boardWhere(viewer({ personId: null, scopes: [scope({ communityId: COMMUNITY_ID })] })),
    ).toBeNull();
  });
});

describe('narrow', () => {
  const filter = { membership: 'MEMBER' } as const;

  it('лишає фільтр як є, коли видно всю базу', () => {
    expect(narrow(filter, undefined)).toEqual(filter);
  });

  it('вимагає обидві умови водночас', () => {
    expect(narrow(filter, CARE)).toEqual({ AND: [filter, CARE] });
  });
});

describe('gatheringWhere', () => {
  const CHURCH_WIDE = {
    communityId: null,
    homeGroupId: null,
    ministryId: null,
    trainingId: null,
  };

  it('віддає весь календар глобальному адміну', () => {
    expect(gatheringWhere(viewer({ roles: [Role.ADMIN] }))).toBeUndefined();
  });

  it('не показує нічого користувачу без ролей', () => {
    expect(gatheringWhere(viewer())).toEqual({ id: { in: [] } });
  });

  it('показує лідеру загальноцерковні зібрання і зібрання його групи', () => {
    const result = gatheringWhere(
      viewer({ roles: [Role.LEADER], scopes: [scope({ homeGroupId: HOME_GROUP_ID })] }),
    );

    expect(result).toEqual({
      OR: [CHURCH_WIDE, { homeGroupId: { in: [HOME_GROUP_ID] } }],
    });
  });

  it('лишає лідеру без областей лише загальноцерковні', () => {
    expect(gatheringWhere(viewer({ roles: [Role.LEADER] }))).toEqual({ OR: [CHURCH_WIDE] });
  });
});
