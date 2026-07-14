export const paths = {
  splash: '/',
  language: '/language',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  changePassword: '/change-password',
  home: '/home',
  profile: '/profile',
  notifications: '/notifications',
  settings: '/settings',
  /** Saki Tours Operations */
  sakiTours: '/modules/saki-tours',
  sakiToursStart: '/modules/saki-tours/start',
  sakiToursHistory: '/modules/saki-tours/history',
  sakiToursHistoryDetail: '/modules/saki-tours/history/:sessionId',
  sakiToursOperation: '/modules/saki-tours/operations/:sessionId',
  sakiToursOperationStarted: '/modules/saki-tours/operations/:sessionId/started',
  sakiToursOperationEnd: '/modules/saki-tours/operations/:sessionId/end',
  sakiToursOperationDay: '/modules/saki-tours/operations/:sessionId/day',
  sakiToursOperationCompleted: '/modules/saki-tours/operations/:sessionId/completed',
  /** Placeholder until HHCO Operations */
  hhco: '/modules/hhco',
  notFound: '/404',
  offline: '/offline',
  maintenance: '/maintenance',
  error: '/error',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];

export function buildSakiToursOperationPath(sessionId: string): string {
  return `/modules/saki-tours/operations/${encodeURIComponent(sessionId)}`;
}

export function buildSakiToursHistoryDetailPath(sessionId: string): string {
  return `/modules/saki-tours/history/${encodeURIComponent(sessionId)}`;
}

export function buildSakiToursOperationStartedPath(sessionId: string): string {
  return `${buildSakiToursOperationPath(sessionId)}/started`;
}

export function buildSakiToursOperationEndPath(sessionId: string): string {
  return `${buildSakiToursOperationPath(sessionId)}/end`;
}

export function buildSakiToursOperationDayPath(sessionId: string): string {
  return `${buildSakiToursOperationPath(sessionId)}/day`;
}

export function buildSakiToursOperationCompletedPath(sessionId: string): string {
  return `${buildSakiToursOperationPath(sessionId)}/completed`;
}
