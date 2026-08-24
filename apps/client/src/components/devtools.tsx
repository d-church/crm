import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

/** Dev-only, loaded lazily so it never reaches the production bundle. */
const Devtools = () => (
  <>
    <TanStackRouterDevtools position="bottom-right" />
    <ReactQueryDevtools buttonPosition="bottom-left" />
  </>
);

export default Devtools;
