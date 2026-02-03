/** 
 * 生成脚本(API)需要用的 Option 数据格式
 */
export interface OptionMsgDTO {
	attribute: string;
	option: string;
	have_sections: any[];
	belong_section: string | null;
	children: OptionMsgDTO[];
}


/** 
 * 页面需要用的 Option 数据格式
 */
export interface OptionMsgVO {
	id: string;
	attribute: string | null;
	attributeMsg: Record<string, any>;
	attributeIsDisabled: boolean;
	option: string | null;
	optionMsg: Record<string, any>;
	options: any[];
	have_sections: any[];
	belong_section: string | null;
	optionIsDisabled: boolean;
	children: OptionMsgVO[];
	_collapsed: boolean;
	_isTopLevel: boolean;
}