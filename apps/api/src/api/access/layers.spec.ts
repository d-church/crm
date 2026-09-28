import { applyLayer } from './layers';

const person = {
  id: 'p1',
  firstName: 'Марія',
  lastName: 'Коваль',
  membership: 'MEMBER',
  phone: '0670000000',
  city: 'Львів',
  // пасторське
  notes: 'говорили після служіння',
  address: 'вул. Стрийська, 1',
  email: 'maria@example.com',
  careNeeded: true,
  followUp: 'PLANNED',
  events: [{ id: 'e1' }],
  steps: [{ id: 's1' }],
  communities: [{ id: 'c1' }],
  churchRoles: [],
};

describe('applyLayer', () => {
  it('віддає пасторський шар повністю і позначає це', () => {
    expect(applyLayer(person, 'pastoral')).toEqual({ ...person, access: { pastoral: true } });
  });

  it('підписує командний шар, щоб клієнт не плутав «закрито» з «порожньо»', () => {
    expect(applyLayer(person, 'team')).toMatchObject({ access: { pastoral: false } });
  });

  it('лишає командному шару те, чим ведуть команду', () => {
    const team = applyLayer(person, 'team') as Record<string, unknown>;

    expect(team).toMatchObject({
      id: 'p1',
      firstName: 'Марія',
      membership: 'MEMBER',
      phone: '0670000000',
      city: 'Львів',
      communities: [{ id: 'c1' }],
      churchRoles: [],
    });
  });

  it('не віддає командному шару нічого пасторського', () => {
    const team = applyLayer(person, 'team') as Record<string, unknown>;

    for (const field of [
      'notes',
      'address',
      'email',
      'careNeeded',
      'followUp',
      'events',
      'steps',
    ]) {
      expect(team).not.toHaveProperty(field);
    }
  });

  it('ховає невідоме поле за замовчуванням', () => {
    const team = applyLayer({ ...person, secretDiagnosis: 'щось дуже особисте' }, 'team');

    expect(team).not.toHaveProperty('secretDiagnosis');
  });
});
