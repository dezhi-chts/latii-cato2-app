import { http } from "@/lib/http";

export const analyzeItem = async (take_off_id: string, template_id: string) => {
	try {
		const url = `/drawing-ai/analyze_item?take_off_id=${take_off_id}&template_id=${template_id}`;
		const response = await http.post(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error analyzing item:", error);
		return { data: null, status: "error" };
	}
};

export const reconcileItems = async (take_off_id: number) => {
	try {
		const url = `/drawing-ai/reconcile_candidates/${take_off_id}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error fetching candidates:", error);
		return { data: null, status: "error" };
	}
};

export const reconcileDefault = async (body: object) => {
	try {
		const url = `/drawing-ai/reconcile_items_default`;
		const response = await http.post(url, body);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error defaulting item:", error);
		return { data: null, status: "error" };
	}
};

export const reconcilePreview = async (body: object) => {
	try {
		const url = `/drawing-ai/reconcile_items_preview`;
		const response = await http.post(url, body);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error previewing item:", error);
		return { data: null, status: "error" };
	}
};

export const reconcliePreviewKeepAll = async (body: object) => {
	try {
		const url = `/drawing-ai/keepall_items_preview`;
		const response = await http.post(url, body);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error previewing item:", error);
		return { data: null, status: "error" };
	}
};

export const reconcileConfirm = async (body: object) => {
	try {
		const url = `/drawing-ai/reconcile_items_confirm`;
		const response = await http.post(url, body);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error completing item:", error);
		return { data: null, status: "error" };
	}
};

export const reconcileKeepAllConfirm = async (body: object) => {
	try {
		const url = `/drawing-ai/keepall_items_confirm`;
		const response = await http.post(url, body);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error completing item:", error);
		return { data: null, status: "error" };
	}
};

export const analyzeItemByGeminiSdk = async (
	take_off_id: string,
	template_id: number,
) => {
	try {
		const url = `/drawing-ai/analyze_item?take_off_id=${take_off_id}&template_id=${template_id}`;
		const response = await http.post(url);
		return { data: response as any, status: "success" };
	} catch (error: any) {
		console.error("Error analyzing item:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

export const getTakeOffResult = async (take_off_id: string) => {
	try {
		const url = `/drawing-ai/take_off_result?take_off_id=${take_off_id}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error fetching take off:", error);
		return { data: null, status: "error" };
	}
};

export const AnalyzeItemBySourceType = async (
	take_off_id: string,
	template_id: number,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/analyze_item_by_source_type?take_off_id=${take_off_id}&template_id=${template_id}`;
		const response = await http.post(url);
		return { data: response as any, status: "success" };
	} catch (error: any) {
		console.error("Error analyzing item by source type:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

/**
 * SSE event data format from server:
 * - heartbeat: {"status": "running", "ts": "2026-04-02T09:55:42.406034"}
 * - completed: {"status": "success", "ts": "2026-04-02T09:57:47.424581"}
 */
export interface SSEEventData {
	status: "running" | "success" | "error" | "cancelled";
	ts: string;
	message?: string;
	result?: any;
	error?: string;
}

export interface AnalyzeSSECallbacks {
	onConnected?: () => void;
	onHeartbeat?: (data: SSEEventData) => void;
	onCompleted?: (result: any) => void;
	onError?: (error: string) => void;
}

/**
 * SSE version of AnalyzeItemBySourceType
 * Returns an object with EventSource instance and close function for cleanup
 */
export const AnalyzeItemBySourceTypeSSE = (
	take_off_id: string,
	template_id: number,
	callbacks: AnalyzeSSECallbacks,
): { eventSource: EventSource; close: () => void } => {
	const baseUrl = process.env.NEXT_PUBLIC_PROJECTS_API || "";
	const url = `${baseUrl}/drawing-ai/drawing_ai/analyze_item_by_source_type?take_off_id=${take_off_id}&template_id=${template_id}`;

	const eventSource = new EventSource(url);
	let isCompleted = false;

	const parseSSEErrorMessage = (rawError: any): string => {
		if (!rawError) return "Analysis failed";
		if (typeof rawError === "string") {
			try {
				const parsed = JSON.parse(rawError);
				const errMessage =
					parsed?.err?.message || parsed?.message || parsed?.error;
				return errMessage || rawError;
			} catch {
				return rawError;
			}
		}
		if (typeof rawError === "object") {
			const errMessage =
				rawError?.err?.message || rawError?.message || rawError?.error;
			return errMessage || "Analysis failed";
		}
		return "Analysis failed";
	};

	eventSource.onopen = () => {
		console.log("[SSE] Connection opened");
		callbacks.onConnected?.();
	};

	// Handle named events: heartbeat, completed
	eventSource.addEventListener("heartbeat", (event: MessageEvent) => {
		console.log("[SSE] Heartbeat:", event.data);
		try {
			const data: SSEEventData = JSON.parse(event.data);
			if (data.status === "running") {
				callbacks.onHeartbeat?.(data);
			}
		} catch (error) {
			console.error("[SSE] Failed to parse heartbeat data:", event.data, error);
		}
	});

	eventSource.addEventListener("completed", (event: MessageEvent) => {
		console.log("[SSE] Completed:", event.data);
		isCompleted = true;
		try {
			const data: SSEEventData = JSON.parse(event.data);
			if (data.status === "success") {
				callbacks.onCompleted?.(data.result);
			} else if (data.status === "error") {
				callbacks.onError?.(data.error || data.message || "Analysis failed");
			} else if (data.status === "cancelled") {
				callbacks.onError?.("Analysis was cancelled");
			}
		} catch (error) {
			console.error("[SSE] Failed to parse completed data:", event.data, error);
			callbacks.onError?.("Failed to parse server response");
		}
		eventSource.close();
	});

	eventSource.addEventListener("error", (event: MessageEvent) => {
		console.log("[SSE] Server error event:", event.data);
		isCompleted = true;
		try {
			const data: SSEEventData & { err?: { message?: string } } = JSON.parse(event.data);
			callbacks.onError?.(parseSSEErrorMessage(data));
		} catch (error) {
			console.error("[SSE] Failed to parse error data:", event.data, error);
			callbacks.onError?.(parseSSEErrorMessage(event.data));
		}
		eventSource.close();
	});

	// Fallback for generic messages (if server sends without event type)
	eventSource.onmessage = (event) => {
		console.log("[SSE] Generic message:", event.data);
		try {
			const data: SSEEventData = JSON.parse(event.data);
			if (data.status === "success") {
				isCompleted = true;
				callbacks.onCompleted?.(data.result);
				eventSource.close();
			} else if (data.status === "error") {
				isCompleted = true;
				callbacks.onError?.(data.error || data.message || "Analysis failed");
				eventSource.close();
			} else if (data.status === "running") {
				callbacks.onHeartbeat?.(data);
			}
		} catch (error) {
			console.error("[SSE] Failed to parse message data:", event.data, error);
		}
	};

	eventSource.onerror = (error) => {
		console.error(
			"[SSE] Connection error:",
			error,
			"readyState:",
			eventSource.readyState,
		);
		// Only report error if not already completed and connection is closed
		if (!isCompleted && eventSource.readyState === EventSource.CLOSED) {
			callbacks.onError?.("SSE connection closed unexpectedly");
		}
		// Prevent auto-reconnect by closing if completed
		if (isCompleted) {
			eventSource.close();
		}
	};

	return {
		eventSource,
		close: () => {
			isCompleted = true;
			eventSource.close();
		},
	};
};

export const getTakeOffResultByFileId = async (
	take_off_id: string,
	file_id: number,
) => {
	try {
		let url = `/drawing-ai/drawing_ai/take_off_result_by_file?take_off_id=${take_off_id}&file_id=${file_id}`;
		let response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error: any) {
		console.error("Error getting take off result by file id:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};
