import { authService } from '@/services/authService';

// Mapeo de secciones a permisos base
export const SECTION_PERMISSIONS = {
  users: {
    base: 'ver_usuarios',
    create: 'crear_usuarios',
    edit: 'editar_usuarios',
    delete: 'eliminar_usuarios',
    admin: 'administrar_usuarios'
  },
  roles: {
    base: 'ver_roles',
    create: 'crear_roles',
    edit: 'editar_roles',
    delete: 'eliminar_roles',
    assign: 'asignar_permisos_roles'
  },
  permissions: {
    base: 'ver_permisos',
    create: 'crear_permisos',
    edit: 'editar_permisos',
    delete: 'eliminar_permisos'
  },
  customers: {
    base: 'ver_clientes',
    create: 'crear_clientes',
    edit: 'editar_clientes',
    delete: 'eliminar_clientes',
    stats: 'ver_stats_clientes'
  },
  pets: {
    base: 'ver_mascotas',
    create: 'crear_mascotas',
    edit: 'editar_mascotas',
    delete: 'eliminar_mascotas'
  },
  orders: {
    base: 'ver_pedidos',
    create: 'crear_pedidos',
    edit: 'editar_pedidos',
    delete: 'eliminar_pedidos',
    changeStatus: 'cambiar_estado_pedidos',
    confirm: 'confirmar_pedidos',
    deliver: 'entregar_pedidos',
    cancel: 'cancelar_pedidos',
    stats: 'ver_stats_pedidos'
  },
  orderProducts: {
    base: 'ver_productos_pedido',
    create: 'crear_productos_pedido',
    edit: 'editar_productos_pedido',
    delete: 'eliminar_productos_pedido'
  },
  inventory: {
    base: 'ver_inventarios',
    create: 'crear_inventarios',
    edit: 'editar_inventarios',
    delete: 'eliminar_inventarios'
  },
  categories: {
    base: 'ver_categorias_producto',
    create: 'crear_categorias_producto',
    edit: 'editar_categorias_producto',
    delete: 'eliminar_categorias_producto'
  },
  weights: {
    base: 'ver_pesos',
    create: 'crear_pesos',
    edit: 'editar_pesos',
    delete: 'eliminar_pesos'
  },
  suppliers: {
    base: 'ver_proveedores',
    create: 'crear_proveedores',
    edit: 'editar_proveedores',
    delete: 'eliminar_proveedores'
  },
  cities: {
    base: 'ver_ciudades',
    create: 'crear_ciudades',
    edit: 'editar_ciudades',
    delete: 'eliminar_ciudades'
  },
  promotions: {
    base: 'ver_promociones',
    create: 'crear_promociones',
    edit: 'editar_promociones',
    delete: 'eliminar_promociones'
  },
  conversations: {
    base: 'ver_conversaciones',
    create: 'crear_conversaciones',
    edit: 'editar_conversaciones',
    delete: 'eliminar_conversaciones',
    changeStatus: 'cambiar_estado_conversaciones',
    assign: 'asignar_conversaciones'
  },
  conversationsChat: {
    base: 'ver_conversaciones_chat',
    create: 'crear_conversaciones_chat',
    edit: 'editar_conversaciones_chat',
    delete: 'eliminar_conversaciones_chat',
    markRead: 'marcar_leido_chat'
  },
  conversationsLogs: {
    base: 'ver_conversaciones_logs',
    create: 'crear_conversaciones_logs',
    edit: 'editar_conversaciones_logs',
    delete: 'eliminar_conversaciones_logs'
  },
  system: {
    base: 'ver_logs',
    configure: 'configurar_sistema',
    backup: 'backup_sistema',
    restore: 'restore_sistema'
  },
  reports: {
    base: 'ver_reportes',
    generate: 'generar_reportes',
    export: 'exportar_reportes'
  },
  routes: {
    base: 'ver_rutas',
    create: 'crear_rutas',
    edit: 'editar_rutas',
    delete: 'eliminar_rutas',
    assign: 'asignar_pedidos_rutas',
    optimize: 'optimizar_rutas',
    follow: 'seguir_rutas',
    complete: 'completar_entregas',
    stats: 'ver_estadisticas_rutas'
  },
  drivers: {
    base: 'ver_repartidores',
    create: 'crear_repartidores',
    edit: 'editar_repartidores',
    delete: 'eliminar_repartidores',
    activate: 'activar_desactivar_repartidores',
    stats: 'ver_estadisticas_repartidores'
  }
} as const;

// Función para verificar si el usuario tiene un permiso específico
export const hasPermission = (permission: string): boolean => {
  const userPermissions = authService.getUserPermissions();
  return userPermissions.includes(permission) || userPermissions.includes('*');
};

// Función para verificar si el usuario tiene acceso a una sección
export const hasSectionAccess = (section: keyof typeof SECTION_PERMISSIONS): boolean => {
  const sectionPermissions = SECTION_PERMISSIONS[section];
  return hasPermission(sectionPermissions.base);
};

// Función para verificar si el usuario puede crear en una sección
export const canCreate = (section: keyof typeof SECTION_PERMISSIONS): boolean => {
  const sectionPermissions = SECTION_PERMISSIONS[section];
  return hasPermission(sectionPermissions.create);
};

// Función para verificar si el usuario puede editar en una sección
export const canEdit = (section: keyof typeof SECTION_PERMISSIONS): boolean => {
  const sectionPermissions = SECTION_PERMISSIONS[section];
  return hasPermission(sectionPermissions.edit);
};

// Función para verificar si el usuario puede eliminar en una sección
export const canDelete = (section: keyof typeof SECTION_PERMISSIONS): boolean => {
  const sectionPermissions = SECTION_PERMISSIONS[section];
  return hasPermission(sectionPermissions.delete);
};

// Función para verificar si el usuario puede ver estadísticas
export const canViewStats = (section: keyof typeof SECTION_PERMISSIONS): boolean => {
  const sectionPermissions = SECTION_PERMISSIONS[section];
  return hasPermission(sectionPermissions.stats);
};

// Función para verificar permisos específicos de pedidos
export const canChangeOrderStatus = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.orders.changeStatus);
};

export const canConfirmOrder = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.orders.confirm);
};

export const canDeliverOrder = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.orders.deliver);
};

export const canCancelOrder = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.orders.cancel);
};

// Función para verificar permisos específicos de conversaciones
export const canChangeConversationStatus = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.conversations.changeStatus);
};

export const canAssignConversation = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.conversations.assign);
};

export const canMarkChatAsRead = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.conversationsChat.markRead);
};

// Función para verificar permisos específicos de roles
export const canAssignPermissions = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.roles.assign);
};

// Función para verificar permisos específicos de sistema
export const canConfigureSystem = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.system.configure);
};

export const canBackupSystem = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.system.backup);
};

export const canRestoreSystem = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.system.restore);
};

// Función para verificar si el usuario puede activar/desactivar repartidores
export const canActivateDriver = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.drivers.activate);
};

// Función para verificar si el usuario puede ver estadísticas de repartidores
export const canViewDriverStats = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.drivers.stats);
};

// Función para verificar permisos específicos de reportes
export const canGenerateReports = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.reports.generate);
};

export const canExportReports = (): boolean => {
  return hasPermission(SECTION_PERMISSIONS.reports.export);
};

// Función para obtener permisos disponibles para una sección
export const getAvailableActions = (section: keyof typeof SECTION_PERMISSIONS): string[] => {
  const actions: string[] = [];
  const sectionPermissions = SECTION_PERMISSIONS[section];

  if (hasSectionAccess(section)) {
    actions.push('view');
  }
  if (canCreate(section)) {
    actions.push('create');
  }
  if (canEdit(section)) {
    actions.push('edit');
  }
  if (canDelete(section)) {
    actions.push('delete');
  }
  if (canViewStats(section)) {
    actions.push('stats');
  }

  return actions;
};
