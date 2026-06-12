export const ROOT_ROUTES = {
  CMS: "/cms",
};

export const ROUTES = {
  LEARN: {
    HOME: "/learn",
  },
  CMS: {
    DASHBOARD: `${ROOT_ROUTES.CMS}/dashboard`,
    VOICES: `${ROOT_ROUTES.CMS}/voices`,
    VOICE_DETAIL: (id: string) => `${ROOT_ROUTES.CMS}/voices/${id}`,
    SCRIPTS: `${ROOT_ROUTES.CMS}/scripts`,
    SCRIPT_NEW: `${ROOT_ROUTES.CMS}/scripts/new`,
    SCRIPT_DETAIL: (id: string) => `${ROOT_ROUTES.CMS}/scripts/${id}`,
    TOPICS: `${ROOT_ROUTES.CMS}/topics`,
    TOPIC_NEW: `${ROOT_ROUTES.CMS}/topics/new`,
    TOPIC_DETAIL: (id: string) => `${ROOT_ROUTES.CMS}/topics/${id}`,
    SPEECHES: `${ROOT_ROUTES.CMS}/speeches`,
    SPEECH_NEW: `${ROOT_ROUTES.CMS}/speeches/new`,
    SPEECH_DETAIL: (id: string) => `${ROOT_ROUTES.CMS}/speeches/${id}`,
    SETTINGS: `${ROOT_ROUTES.CMS}/settings`,
    SETTINGS_PERSONAL: `${ROOT_ROUTES.CMS}/settings/personal`,
    SETTINGS_CMS: `${ROOT_ROUTES.CMS}/settings/cms`,
  },
  PUBLIC: {
    HOME: "/",
    SIGNIN: "/api/auth/signin",
    SIGNUP: "/signup",
    SIGNOUT: "/api/auth/signout",
    FORBIDDEN: "/forbidden",
  },
} as const;

export function signInUrl(callbackUrl: string = ROUTES.LEARN.HOME): string {
  const params = new URLSearchParams({ callbackUrl });
  return `${ROUTES.PUBLIC.SIGNIN}?${params.toString()}`;
}
