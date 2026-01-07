export interface OptionMsgDTO {
	attribute: string;
	option: string;
	children: OptionMsgDTO[];
}


export interface OptionMsgVO {
	attribute: string;
	attributeTree: any[];
	option: string;
	options: any[];
	children: OptionMsgVO[];
}