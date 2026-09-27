export const environment = {
  production: false,

  /**
   * Base URL for the REST API. Points at the real NestJS backend
   * (see ../backend, served at http://localhost:3000/api/v1).
   *
   * The in-memory mock (see core/mock/mock-backend.interceptor.ts) intercepts
   * requests only while `useMockApi` is true, so this URL is ignored until the
   * toggle below is flipped.
   */
  apiUrl: 'http://localhost:3000/api/v1',

  /**
   * When true, an in-memory mock backend intercepts HTTP calls and no network
   * requests leave the app. Flip to `false` to run against the real backend at
   * `apiUrl` above. Kept `true` by default so the app (and its tests) work
   * out of the box without a running backend.
   */
  useMockApi: false,

  /** Base URL of the public site renderer app (for website preview links). */
  siteRendererUrl: 'http://localhost:4300',
};
