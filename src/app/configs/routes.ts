export const ROOT_ROUTES = {
  CMS: "/cms",
};

export const ROUTES = {
  CMS: {
    DASHBOARD: ROOT_ROUTES.CMS,
    VOICES: `${ROOT_ROUTES.CMS}/voices`,
    SCRIPTS: `${ROOT_ROUTES.CMS}/scripts`,
    SPEECHES: `${ROOT_ROUTES.CMS}/speeches`,
    SETTINGS: `${ROOT_ROUTES.CMS}/settings`,
  },
  PUBLIC: {
    SIGNIN: "/api/auth/signin",
    SIGNOUT: "/api/auth/signout",
  },
} as const;
