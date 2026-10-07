import type { ConversacionLogEntry } from "@/services/conversationLogsService";

const LOG_TYPE_LABELS: Record<string, string> = {
	inicio: "Inicio",
	mensaje: "Mensaje",
	transferencia: "Transferencia",
	escalacion: "Escalación",
	cierre: "Cierre",
	error: "Error",
	sistema: "Sistema",
};

const DATA_FIELD_LABELS: Record<string, string> = {
	pedido_id: "ID pedido",
	numero_pedido: "Nº pedido",
	cliente_id: "Cliente",
	cliente_anterior: "Cliente anterior",
	cliente_nuevo: "Cliente nuevo",
	total: "Total",
	estado: "Estado del pedido",
	status_anterior: "Estado anterior",
	status_nuevo: "Estado nuevo",
	status_inicial: "Estado inicial",
	whatsapp_message_id: "Mensaje WhatsApp",
	mensaje_id: "ID mensaje",
	error: "Error",
	motivo: "Motivo",
	fuente: "Origen",
	from: "Remitente",
	tipo_usuario: "Tipo de usuario",
	telefono: "Teléfono",
};

const HIDDEN_DATA_KEYS = new Set([
	"updated_by",
	"changed_by",
	"assigned_by",
	"deleted_by",
	"restored_by",
	"mensaje_from",
	"mensaje_length",
	"tipo_mensaje",
	"template_used",
	"operator_whatsapp_text_sent",
]);

export function getLogTypeLabel(tipo: string): string {
	return LOG_TYPE_LABELS[tipo] ?? tipo;
}

export function getLogTimestamp(log: ConversacionLogEntry): Date | null {
	if (log.created_at) {
		const date = new Date(log.created_at);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	if (log.fecha && log.hora) {
		const date = new Date(`${log.fecha}T${log.hora}`);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	return null;
}

export function sortLogsDesc(logs: ConversacionLogEntry[]): ConversacionLogEntry[] {
	return [...logs].sort((a, b) => {
		const timeA = getLogTimestamp(a)?.getTime() ?? 0;
		const timeB = getLogTimestamp(b)?.getTime() ?? 0;
		return timeB - timeA;
	});
}

function formatDataValue(key: string, value: unknown): string {
	if (key === "total" && (typeof value === "number" || typeof value === "string")) {
		const amount = Number(value);
		if (!Number.isNaN(amount)) {
			return new Intl.NumberFormat("es-MX", {
				style: "currency",
				currency: "MXN",
			}).format(amount);
		}
	}
	if (typeof value === "boolean") {
		return value ? "Sí" : "No";
	}
	if (value === null || value === undefined) {
		return "—";
	}
	return String(value);
}

export function getLogDetailRows(
	log: ConversacionLogEntry
): { label: string; value: string }[] {
	const data = log.data;
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return [];
	}

	return Object.entries(data)
		.filter(([key, value]) => !HIDDEN_DATA_KEYS.has(key) && value != null && value !== "")
		.map(([key, value]) => ({
			label: DATA_FIELD_LABELS[key] ?? key.replace(/_/g, " "),
			value: formatDataValue(key, value),
		}));
}

export function isLogError(log: ConversacionLogEntry): boolean {
	return log.nivel === "error" || log.tipo_log === "error";
}
