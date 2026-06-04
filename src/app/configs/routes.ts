export const ROOT_ROUTES = {
  CMS: "/cms",
};

export const ROUTES = {
  CMS: {
    DASHBOARD: `${ROOT_ROUTES.CMS}/dashboard`,
    VOICES: `${ROOT_ROUTES.CMS}/voices`,
    VOICE_DETAIL: (id: string) => `${ROOT_ROUTES.CMS}/voices/${id}`,
    SCRIPTS: `${ROOT_ROUTES.CMS}/scripts`,
    SCRIPT_NEW: `${ROOT_ROUTES.CMS}/scripts/new`,
    SCRIPT_DETAIL: (id: string) => `${ROOT_ROUTES.CMS}/scripts/${id}`,
    SPEECHES: `${ROOT_ROUTES.CMS}/speeches`,
    SETTINGS: `${ROOT_ROUTES.CMS}/settings`,
  },
  PUBLIC: {
    SIGNIN: "/api/auth/signin",
    SIGNOUT: "/api/auth/signout",
  },
} as const;
