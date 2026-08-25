import { RestService } from './abstracts/rest-service';

class PersonServiceClass extends RestService<Person> {
  protected anchor = 'people';
}

export const PersonStatus = {
  GUEST: 'GUEST',
  NEW: 'NEW',
  MEMBER: 'MEMBER',
  SERVANT: 'SERVANT',
  INACTIVE: 'INACTIVE',
} as const;

export type PersonStatus = (typeof PersonStatus)[keyof typeof PersonStatus];

export interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: PersonStatus;
  smallGroup: string | null;
  ministry: string | null;
  birthDate: string | null;
  joinedAt: string | null;
  lastSeenAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getPersonName = ({ firstName, lastName }: Person) =>
  [firstName, lastName].filter(Boolean).join(' ');

export const PersonService = new PersonServiceClass();
