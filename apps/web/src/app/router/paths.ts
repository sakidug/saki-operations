export const paths = {
  splash: '/',
  language: '/language',
  /** Guest employee landing — Start / Continue Operation (no JWT). */
  entry: '/entry',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  changePassword: '/change-password',
  /** Authenticated admin / office dashboard */
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
  /** HHCO Helmet Delivery Operations */
  hhco: '/modules/hhco',
  hhcoStart: '/modules/hhco/start',
  hhcoHistory: '/modules/hhco/history',
  hhcoHistoryDetail: '/modules/hhco/history/:sessionId',
  hhcoDelivery: '/modules/hhco/deliveries/:sessionId',
  hhcoDeliveryStarted: '/modules/hhco/deliveries/:sessionId/started',
  hhcoDeliveryEnd: '/modules/hhco/deliveries/:sessionId/end',
  hhcoDeliveryDay: '/modules/hhco/deliveries/:sessionId/day',
  hhcoDeliveryCompleted: '/modules/hhco/deliveries/:sessionId/completed',
  /** Leave / Vehicles / Employees (Phases 7.4–7.6) */
  leave: '/modules/leave',
  leaveApply: '/modules/leave/apply',
  leaveDetail: '/modules/leave/:id',
  vehicles: '/modules/vehicles',
  vehicleDetail: '/modules/vehicles/:vehicleId',
  employees: '/modules/employees',
  employeeDetail: '/modules/employees/:employeeId',
  /** Office Dashboard / Reports (Phases 7.7–7.8) */
  officeDashboard: '/modules/office-dashboard',
  reports: '/modules/reports',
  reportDetail: '/modules/reports/:reportType',
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


export function buildHhcoDeliveryPath(sessionId: string): string {
  return `/modules/hhco/deliveries/${encodeURIComponent(sessionId)}`;
}

export function buildHhcoHistoryDetailPath(sessionId: string): string {
  return `/modules/hhco/history/${encodeURIComponent(sessionId)}`;
}

export function buildHhcoDeliveryStartedPath(sessionId: string): string {
  return `${buildHhcoDeliveryPath(sessionId)}/started`;
}

export function buildHhcoDeliveryEndPath(sessionId: string): string {
  return `${buildHhcoDeliveryPath(sessionId)}/end`;
}

export function buildHhcoDeliveryDayPath(sessionId: string): string {
  return `${buildHhcoDeliveryPath(sessionId)}/day`;
}

export function buildHhcoDeliveryCompletedPath(sessionId: string): string {
  return `${buildHhcoDeliveryPath(sessionId)}/completed`;
}

// Legacy aliases used during Tours→HHCO adaptation
export const buildHhcoOperationPath = buildHhcoDeliveryPath;
export const buildHhcoOperationStartedPath = buildHhcoDeliveryStartedPath;
export const buildHhcoOperationEndPath = buildHhcoDeliveryEndPath;
export const buildHhcoOperationDayPath = buildHhcoDeliveryDayPath;
export const buildHhcoOperationCompletedPath = buildHhcoDeliveryCompletedPath;

export function buildLeaveDetailPath(id: string): string {
  return `/modules/leave/${encodeURIComponent(id)}`;
}

export function buildVehicleDetailPath(vehicleId: string): string {
  return `/modules/vehicles/${encodeURIComponent(vehicleId)}`;
}

export function buildEmployeeDetailPath(employeeId: string): string {
  return `/modules/employees/${encodeURIComponent(employeeId)}`;
}

export function buildReportDetailPath(
  reportType: string,
  period?: 'daily' | 'monthly',
): string {
  const base = `/modules/reports/${encodeURIComponent(reportType)}`;
  if (!period) return base;
  return `${base}?period=${encodeURIComponent(period)}`;
}
