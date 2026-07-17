import { Controller, Get } from '@nestjs/common';
import { MODULE_ACCESS_PERMISSION, canAccessModule } from '@saki-operations/constants';
import type { AuthUser } from '@saki-operations/types';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Module access gates (Phase 9.1).
 * Enforces JwtAuthGuard (global) + PermissionsGuard / RolesGuard via metadata.
 * Business data for Tours/HHCO remains client-local until Saki Sync (9.2).
 */
@Controller('modules')
export class ModulesController {
  @Get('access')
  @Roles('driver', 'assistant', 'office', 'admin')
  access(@CurrentUser() user: AuthUser) {
    return {
      data: {
        role: user.role,
        permissions: user.permissions,
        modules: {
          tours: canAccessModule(user.permissions, 'tours'),
          hhco: canAccessModule(user.permissions, 'hhco'),
          leave: canAccessModule(user.permissions, 'leave'),
          vehicles: canAccessModule(user.permissions, 'vehicles'),
          employees: canAccessModule(user.permissions, 'employees'),
          officeDashboard: canAccessModule(user.permissions, 'officeDashboard'),
          reports: canAccessModule(user.permissions, 'reports'),
        },
      },
    };
  }

  @Get('tours')
  @Permissions(MODULE_ACCESS_PERMISSION.tours)
  tours() {
    return { data: { module: 'tours', allowed: true } };
  }

  @Get('hhco')
  @Permissions(MODULE_ACCESS_PERMISSION.hhco)
  hhco() {
    return { data: { module: 'hhco', allowed: true } };
  }

  @Get('leave')
  @Permissions(MODULE_ACCESS_PERMISSION.leave)
  leave() {
    return { data: { module: 'leave', allowed: true } };
  }

  @Get('vehicles')
  @Permissions(MODULE_ACCESS_PERMISSION.vehicles)
  vehicles() {
    return { data: { module: 'vehicles', allowed: true } };
  }

  @Get('employees')
  @Permissions(MODULE_ACCESS_PERMISSION.employees)
  employees() {
    return { data: { module: 'employees', allowed: true } };
  }

  @Get('office-dashboard')
  @Permissions(MODULE_ACCESS_PERMISSION.officeDashboard)
  @Roles('office', 'admin')
  officeDashboard() {
    return { data: { module: 'officeDashboard', allowed: true } };
  }

  @Get('reports')
  @Permissions(MODULE_ACCESS_PERMISSION.reports)
  @Roles('office', 'admin')
  reports() {
    return { data: { module: 'reports', allowed: true } };
  }
}
