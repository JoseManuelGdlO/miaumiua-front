import type { ConversationsQueryParams } from "@/services/conversationsService";
import { conversationsService } from "@/services/conversationsService";

export type ConversationKpiCounts = {
  activas: number;
  errores: number;
  escaladas: number;
  cerradas: number;
};

export type ConversationListFilter =
  | "all"
  | "activa"
  | "error"
  | "escalado"
  | "cerrada"
  | "pausada"
  | "en_espera";

export const CONVERSATION_LIST_FILTER_OPTIONS: {
  value: ConversationListFilter;
  label: string;
}[] = [
  { value: "all", label: "Todos los estados" },
  { value: "activa", label: "Activas" },
  { value: "error", label: "Con errores" },
  { value: "escalado", label: "Escaladas" },
  { value: "cerrada", label: "Resueltas (cerradas)" },
  { value: "pausada", label: "Pausadas" },
  { value: "en_espera", label: "En espera" },
];

export const KPI_FILTER_KEYS: ConversationListFilter[] = [
  "activa",
  "error",
  "escalado",
  "cerrada",
];

export function getListFilterLabel(filter: ConversationListFilter): string {
  return (
    CONVERSATION_LIST_FILTER_OPTIONS.find((o) => o.value === filter)?.label ??
    filter
  );
}

export function buildListQueryParams(
  listFilter: ConversationListFilter
): Pick<ConversationsQueryParams, "status" | "has_error" | "has_escalation"> {
  switch (listFilter) {
    case "activa":
    case "pausada":
    case "cerrada":
    case "en_espera":
      return { status: listFilter };
    case "error":
      return { has_error: true };
    case "escalado":
      return { has_escalation: true };
    default:
      return {};
  }
}

export function buildListScopeParams(
  searchTerm: string,
  selectedFlags: number[]
): Pick<ConversationsQueryParams, "search" | "flags"> {
  const search = searchTerm.trim() || undefined;
  const flags = selectedFlags.length > 0 ? selectedFlags : undefined;
  return { search, flags };
}

/** KPI counts using the same list API filters (search/flags), not the active status filter. */
export async function fetchConversationKpiStats(
  scope: Pick<ConversationsQueryParams, "search" | "flags">
): Promise<ConversationKpiCounts> {
  const pairs = await Promise.all(
    KPI_FILTER_KEYS.map(async (filterKey) => {
      const res = await conversationsService.getConversations({
        ...scope,
        ...buildListQueryParams(filterKey),
        page: 1,
        limit: 1,
      });
      return [filterKey, res?.data?.pagination?.total ?? 0] as const;
    })
  );
  const byFilter = Object.fromEntries(pairs) as Record<
    (typeof KPI_FILTER_KEYS)[number],
    number
  >;
  return {
    activas: byFilter.activa ?? 0,
    errores: byFilter.error ?? 0,
    escaladas: byFilter.escalado ?? 0,
    cerradas: byFilter.cerrada ?? 0,
  };
}
