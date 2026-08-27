import { RestService } from './abstracts/rest-service';

class PersonServiceClass extends RestService<Person> {
  protected anchor = 'people';
}

export const PersonStatus = {
  NEW: 'NEW',
  CONNECTED: 'CONNECTED',
  NEXT_STEP: 'NEXT_STEP',
  COMMUNITY: 'COMMUNITY',
  SERVING: 'SERVING',
  CARE: 'CARE',
  INACTIVE: 'INACTIVE',
} as const;

export type PersonStatus = (typeof PersonStatus)[keyof typeof PersonStatus];

export const FollowUpState = {
  NOT_DONE: 'NOT_DONE',
  PLANNED: 'PLANNED',
  DONE: 'DONE',
} as const;

export type FollowUpState = (typeof FollowUpState)[keyof typeof FollowUpState];

export interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  homePhone: string | null;
  workPhone: string | null;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  district: string | null;
  region: string | null;
  status: PersonStatus;
  firstVisitAt: string | null;
  lastSeenAt: string | null;
  connectedBy: string | null;
  followUp: FollowUpState;
  nextStep: string | null;
  community: string | null;
  ministry: string | null;
  responsible: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  birthDate: string | null;
  baptizedAt: string | null;
  memberSince: string | null;
  leftAt: string | null;
  /** Код_ЧлениЦеркви зі старої бази Access, якщо людина прийшла звідти. */
  legacyId: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getPersonName = ({ firstName, lastName }: Person) =>
  [firstName, lastName].filter(Boolean).join(' ');

export const PersonService = new PersonServiceClass();
