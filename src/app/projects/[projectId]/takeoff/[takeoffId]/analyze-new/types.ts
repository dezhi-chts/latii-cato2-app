export interface TemplateField {
	id?: string | number;
	name: string;
}

export interface TakeoffResult {
	id?: number;
	name?: string;
	template_id?: number;
	status?: number;
}

export interface ImagePageInfo {
	file_name?: string;
	s3_key?: string;
	s3_url?: string;
}

export interface ProjectFileParseDetail {
	image_page_infos?: ImagePageInfo[];
	uploaded_file_url?: string;
	uploaded_file_name?: string;
}

export interface ProjectFileRecord {
	id: number;
	file_name?: string;
	status?: string;
	parse_detail?: ProjectFileParseDetail;
}

export interface TakeoffItemRecord {
	sequence_number: number;
	id: number;
	take_off_id?: number;
	project_file_id: number;
	evidence_id?: number;
	evidence_ids?: string;
	evidence_id_list?: number[];
	is_checked: boolean;
	is_deleted?: boolean;
	is_reconciled?: boolean;
	result: string | Record<string, unknown>;
}

export interface TakeoffDetailsData {
	take_off_result?: TakeoffResult;
	project_files?: ProjectFileRecord[];
	all_items?: Record<string, TakeoffItemRecord[]>;
	total_items?: number;
	reconcile_candidate_count?: Record<string, number>;
}

export interface EvidencePoint {
	x: number;
	y: number;
}

export interface EvidenceRecord {
	id: number;
	project_file_id: number;
	project_file_page_number?: number;
	polygon?: string | EvidencePoint[];
	scale?: number;
	page_width_pdf?: number;
	page_height_pdf?: number;
	view_box?: string | number[];
	is_rotate?: boolean;
	rotation_angle?: number;
	is_manual?: boolean;
	evidence_url?: string;
	type?: string;
}

export interface SummaryStats {
	items: number;
	products: number;
	systems: number;
	boxed_items: number;
	window_items: number;
	door_items: number;
}

export interface EvidenceBoxBounds {
	id: number;
	left: number;
	top: number;
	width: number;
	height: number;
	source_width?: number;
	source_height?: number;
}
