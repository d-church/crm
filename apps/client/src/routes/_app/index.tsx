import { createFileRoute, redirect } from '@tanstack/react-router';

import { UserRole } from '@/services';

/**
 * Адміну потрібен увесь список людей, лідеру — його підопічні й команди.
 * Тому корінь веде їх у різні місця.
 */
export const Route = createFileRoute('/_app/')({
  beforeLoad: ({ context }) => {
    const roles = context.user.roles?.length ? context.user.roles : [context.user.role];
    const isAdmin = roles.some((role) => role === UserRole.SUPERADMIN || role === UserRole.ADMIN);

    if (isAdmin) throw redirect({ to: '/people' });

    // Служителю конекту весь «Огляд» ні до чого: його робота — борда.
    const isConnectOnly = roles.every((role) => role === UserRole.CONNECT);

    throw redirect({ to: isConnectOnly ? '/connect' : '/overview' });
  },
});
