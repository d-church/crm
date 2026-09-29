import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { getPersonName, type PersonChoice } from '@/services';

/**
 * Рядок фактів під назвою сутності: категорія, адреса, лідер. Це довідка, а не
 * форма — те, що міняється раз на рік, не має займати перший екран полями вводу.
 * Редагування живе нижче, у згорнутих «Налаштуваннях».
 */
export const DetailFacts = ({ items }: { items: (ReactNode | null | undefined)[] }) => {
  const visible = items.filter(Boolean);

  if (visible.length === 0) return null;

  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {visible.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 ? <span className="text-ink-faint">·</span> : null}
          {item}
        </span>
      ))}
    </span>
  );
};

/** Лідер — людина, тож із фактів має бути як потрапити в її картку. */
export const LeaderFact = ({ label, leader }: { label: string; leader: PersonChoice | null }) =>
  leader === null ? null : (
    <span>
      {label}:{' '}
      <Link
        to="/people/$personId"
        params={{ personId: leader.id }}
        className="text-ink underline-offset-3 hover:underline"
      >
        {getPersonName(leader)}
      </Link>
    </span>
  );
