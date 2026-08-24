export const OPENAPI_TITLE = 'D.Church CRM API';
export const OPENAPI_DESCRIPTION = [
  'REST API for the D.Church CRM.',
  'Authentication uses JWT bearer tokens: send the access token as `Authorization: Bearer <token>`.',
].join('\n\n');
export const OPENAPI_VERSION = '1.0.0';

export const OPENAPI_JSON_PATH = '/openapi.json';
export const OPENAPI_DOCS_PATH = '/docs';
export const OPENAPI_SERVER_URL = '/';
export const ACCESS_TOKEN_SECURITY_NAME = 'accessToken';
