import { createFileRoute, redirect } from '@tanstack/react-router';

/** The panel has a single section for now — send the root straight to it. */
export const Route = createFileRoute('/_app/')({
  beforeLoad: () => {
    throw redirect({ to: '/people' });
  },
});
