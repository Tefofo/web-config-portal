export const environment = {
  production: true,

  /**
   * Base URL for the REST API in production builds. Points at the real NestJS
   * backend. Override at deploy time if the API is served from another origin.
   */
  apiUrl: 'http://localhost:3000/api/v1',

  /**
   * Set to `false` once a real REST backend is available so requests hit
   * `apiUrl` instead of the in-memory mock. Kept `true` by default.
   */
  useMockApi: true,

  /** Base URL of the public site renderer app (for website preview links). */
  siteRendererUrl: 'http://localhost:4300',
};
