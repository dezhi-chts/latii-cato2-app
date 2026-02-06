import { OptionMsgVO, OptionMsgDTO } from "@/app/brand-editor/components/body-components/validators";
const profileStartAnnotation = "# Profile msg script start (Cannot be deleted or modified, the processing script will use)";
const profileEndAnnotation = "# Profile msg script end (Cannot be deleted or modified, the processing script will use)";
const ruleMsgStartAnnotation = "# Rule msg script start (Cannot be deleted or modified, the processing script will use)";
const ruleMsgEndAnnotation = "# Rule msg script end (Cannot be deleted or modified, the processing script will use)";
const uiLogicMsgStartAnnotation = "# UI logic msg script start (Cannot be deleted or modified, the processing script will use)";
const uiLogicMsgEndAnnotation = "# UI logic msg script end (Cannot be deleted or modified, the processing script will use)";


/** 
 * 递归获取attribute类的key和value
 */
export const collectCodes = (tree: any, result: any = [], parentCode: string = "") => {
	for (const node of tree) {

		// 计算当前节点的 classCode 原始部分
		let rawCode = node.code.includes("$") ? node.code.split("$")[1] : node.code;

		const tempObj = JSON.parse(JSON.stringify(node));

		// classCode = 父级code + 自己的 rawCode
		tempObj.classCode = parentCode
			? `${parentCode}_${rawCode}`   // 可按需求换成 "_" 或直接拼接
			: rawCode;

		if (node.version_id != "0") {
			result.push(tempObj);
		}

		// if (node.valueType !== "STRUCT") {
		// 	// 给非 STRUCT 节点构建 classCode
		// 	const tempObj = JSON.parse(JSON.stringify(node));

		// 	// classCode = 父级code + 自己的 rawCode
		// 	tempObj.classCode = parentCode
		// 		? `${parentCode}_${rawCode}`   // 可按需求换成 "_" 或直接拼接
		// 		: rawCode;

		// 	result.push(tempObj);
		// }

		// 递归遍历 children
		if (node.children && node.children.length > 0) {
			// 下一层的 parentCode = 当前节点的 rawCode（不是 STRUCT 也不是 valueType）
			const nextParentCode = parentCode
				? `${parentCode}_${rawCode}`
				: rawCode;

			collectCodes(node.children, result, nextParentCode);
		}
	}

	return result;
};

/** 
 * 递归获取option类的key和value
 */
export const collectOptionCodes = (tree: any, result: any = []) => {
	for (const node of tree) {
		if (node.valueType !== "STRUCT") {
			if (node.options && node.options.length != 0) {
				node.options.forEach((i: any) => {
					let tempObj = JSON.parse(JSON.stringify({
						attr: node,
						option: i
					}))
					let tempOptionUseKey = tempObj.option.code
					// if (node.valueType === "IMAGE") {
					// 	tempOptionUseKey = tempObj.option.name
					// }
					tempObj.classCode = `${tempObj.attr.code.includes("$") ? tempObj.attr.code.split("$")[1] : tempObj.attr.code}/${tempOptionUseKey}`
					result.push(tempObj)
				})
			}
		}
		if (node.children && node.children.length > 0) {
			collectOptionCodes(node.children, result);
		}
	}
	return result;
}

/** 
 * 生成公用脚本
 */
export const generateCommonScript = (): string => {
	return [
		"# typing key_words.",
		"# typing events.",
		"# typing project_attributes.",
		"# typing quote_attributes.",
		"# typing item_attributes.",
		"# typing unit_attributes.",
		"# typing project_options.",
		"# typing quote_options.",
		"# typing item_options.",
		"# typing unit_options.",
		"# typing profile_msg",
		"# typing rule_msg",
		"# typing attribute",
		"# typing option",
		"# typing children",
	].join("\n");
};

/** 
 * 生成关键字类的脚本
 */
export const generateKeyWordsClassScript = (): string => {
	const keyWords = [
		"profile_msg",
		"rule_msg",
		"project_attributes",
		"quote_attributes",
		"item_attributes",
		"unit_attributes",
		"project_options",
		"quote_options",
		"item_options",
		"unit_options",
		"attribute",
		"option",
		"children"
	];
	const lines = ["", "class key_words:"];
	keyWords.forEach((k: string) => {
		lines.push(`	${k} = "${k}"`);
	});
	lines.push(`	empty = ""`);
	return "\n" + lines.join("\n");
}

/** 
 * 生成事件类的脚本
 */
export const generateEventsClassScript = (): string => {
	let events = [
		"on_change"
	]
	const lines = ["", "class events:"];
	events.forEach((k: string) => {
		lines.push(`    ${k} = "${k}"`);
	});
	return "\n" + lines.join("\n") + "\n";
}

/** 
 * 生成project attribute类的脚本
 */
export const generateProjectAttributesClassScriptFromTree = (tree: Record<string, any>): string => {
	const attrs = collectCodes([tree]);
	let str = "\nclass project_attributes:\n";
	if (attrs.length != 0) {
		for (const a of attrs) {
			str += `    ${a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()} = "${a.code}"\n`;
		}
	} else {
		str += `	pass\n`;
	}
	return str
};

/** 
 * 生成quote attribute类的脚本
 */
export const generateQuoteAttributesClassScriptFromTree = (tree: Record<string, any>): string => {
	const attrs = collectCodes([tree]);
	let str = "\nclass quote_attributes:\n";
	if (attrs.length != 0) {
		for (const a of attrs) {
			str += `    ${a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()} = "${a.code}"\n`;
		}
	} else {
		str += `	pass\n`;
	}
	return str
};

/** 
 * 生成item attribute类的脚本
 */
export const generateItemAttributesClassScriptFromTree = (tree: Record<string, any>): string => {
	const attrs = collectCodes([tree]);
	let str = "\nclass item_attributes:\n";
	if (attrs.length != 0) {
		for (const a of attrs) {
			str += `    ${a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()} = "${a.code}"\n`;
		}
	} else {
		str += `	pass\n`;
	}
	return str
};

/** 
 * 生成unit attribute类的脚本
 */
export const generateUnitAttributesClassScriptFromTree = (tree: Record<string, any>): string => {
	const attrs = collectCodes([tree]);
	let str = "\nclass unit_attributes:\n";
	if (attrs.length != 0) {
		for (const a of attrs) {
			str += `    ${a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()} = "${a.code}"\n`;
		}
	} else {
		str += `	pass\n`;
	}
	return str
};

/** 
 * 生成project option类的脚本
 */
export const generateProjectOptionsClassScriptFromTree = (tree: Record<string, any>): string => {
	const options = collectOptionCodes([tree]);
	let str = "\nclass project_options:\n";
	if (options.length != 0) {
		for (const a of options) {
			str += `	${a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()} = "${a.option.code}"\n`;
		}
	} else {
		str += `	pass\n`;
	}
	return str
};

/** 
 * 生成quote option类的脚本
 */
export const generateQuoteOptionsClassScriptFromTree = (tree: Record<string, any>): string => {
	const options = collectOptionCodes([tree]);
	let str = "\nclass quote_options:\n";
	if (options.length != 0) {
		for (const a of options) {
			str += `	${a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()} = "${a.option.code}"\n`;
		}
	} else {
		str += `	pass\n`;
	}
	return str
};

/** 
 * 生成item option类的脚本
 */
export const generateItemOptionsClassScriptFromTree = (tree: Record<string, any>): string => {
	const options = collectOptionCodes([tree]);
	let str = "\nclass item_options:\n";
	if (options.length != 0) {
		for (const a of options) {
			str += `	${a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()} = "${a.option.code}"\n`;
		}
	} else {
		str += `	pass\n`;
	}
	return str
};

/** 
 * 生成unit option类的脚本
 */
export const generateUnitOptionsClassScriptFromTree = (tree: Record<string, any>): string => {
	const options = collectOptionCodes([tree]);
	let str = "\nclass unit_options:\n";
	if (options.length != 0) {
		for (const a of options) {
			str += `	${a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()} = "${a.option.code}"\n`;
		}
	} else {
		str += `	pass\n`;
	}
	return str + "\n"
};

/** 
 * 生成空白模板rule msg的脚本
 */
export const generateBlankTemplateRuleMsgScript = (): string => {
	// let str = "\n\nrule_msg = {}\n";
	// return str
	let str = 
`
def rule_unit_width():
	pass

def rule_unit_height():
	pass

def rule_item_quantity():
	pass

rule_msg = {	
	unit_attributes.width: rule_unit_width,
	unit_attributes.height: rule_unit_height,
	unit_attributes.weight: rule_item_quantity,
};`
	return str
};

/** 
 * 生成空白模板ui logic msg的脚本
 */
export const generateBlankTemplateUiLogicMsgScript = (): string => {
	let str = "ui_logic_msg = {}";
	return str
};

/** 
 * 递归处理attribute tree数据
 * 1. 将当前节点的 `value` 和 `key` 设置为 `code`，即：tree.value = tree.code, tree.key = tree.code
 * 2. 如果 `valueType` 不是 STRING或IMAGE, 就禁用
 * 3. 如果当前节点有子节点（children），递归处理每个子节点
 */
export const processUnitAttributeTree = (tree: Record<string, any>): Record<string, any> => {
	// 处理当前节点

	tree.disabled = true;
	if (tree.valueType == "STRING" || tree.valueType == "IMAGE") {
		tree.disabled = false;
	}
	tree.value = tree.code;
	tree.key = tree.code;

	// 如果有 children，递归处理
	if (tree.children && tree.children.length > 0) {
		tree.children = tree.children.map((child: Record<string, any>) => processUnitAttributeTree(child));
	}

	return tree;
};

/** 
 * 根据attributeCode获取attributeMsg
 */
export const getAttributeMsgByAttribute = (attributeCode: string, attributeTree: Record<string, any>): Record<string, any> => {
	if (!attributeTree) return {};

	// 如果当前节点匹配 attributeCode
	if (attributeTree.code === attributeCode) {
		// 返回节点的副本，并清空 children
		const nodeCopy = { ...attributeTree, children: [], options: [] };
		return nodeCopy;
	}

	// 如果有子节点，递归查找
	if (attributeTree.children && attributeTree.children.length > 0) {
		for (let child of attributeTree.children) {
			const result = getAttributeMsgByAttribute(attributeCode, child);
			if (result && result.code) {
				return result;
			}
		}
	}

	// 没找到匹配节点
	return {};
};

/** 
 * 根据optionCode获取optionMsg
 */
export const getOptionMsgByOption = (optionCode: string, options: any[]): Record<string, any> => {
	// 遍历 options 数组
	for (let option of options) {
		// 如果当前 option 的 optionCode 匹配，返回该 option 对应的消息
		if (option.code === optionCode) {
			return option;
		}
	}

	// 如果没有找到匹配的 optionCode，返回 null
	return {};
};

/** 
 * 把接口获取到的profile msg脚本转成json格式
 */
export const buildProfileMsgJsonNode = (
	profileScriptMsg: string
): Record<string, any> => {
	// 1. 只给 attribute / option / children / have_sections / belong_section 的 key 加引号
	let jsonStr = profileScriptMsg.replace(
		/([,{]\s*)(attribute|option|children|have_sections|belong_section)\s*:/g,
		'$1"$2":'
	);

	// 2.1 option 为「数组」时，遍历每一项加引号（先处理）
	jsonStr = jsonStr.replace(
		/"option"\s*:\s*\[([^\]]*)\]/g,
		(_, content) => {
			if (!content.trim()) return '"option":[]';
			const items = content
				.split(',')
				.map((v: string) => `"${v.trim()}"`)
				.join(',');
			return `"option":[${items}]`;
		}
	);

	// 2.2 attribute / option / belong_section 为「单值」时加引号（明确排除数组）
	jsonStr = jsonStr.replace(
		/"(attribute|option|belong_section)"\s*:\s*(?!\[)([a-zA-Z_$][\w$.]*)/g,
		'"$1":"$2"'
	);

	// 3. 遍历 have_sections 的 value，给每一项加引号
	jsonStr = jsonStr.replace(
		/"have_sections"\s*:\s*\[([^\]]*)\]/g,
		(_, content) => {
			if (!content.trim()) return '"have_sections":[]';
			const items = content
				.split(',')
				.map((v: string) => `"${v.trim()}"`)
				.join(',');
			return `"have_sections":[${items}]`;
		}
	);

	return JSON.parse(jsonStr);
};

/** 
 * 根据profileMsg生成页面所需要的结构
 */
export const generateOptionMsgFromProfileJson = (
	profileMsg: Record<string, any>,
	unitAttributeTree: Record<string, any>
): OptionMsgVO => {

	const attrs = collectCodes([unitAttributeTree]);
	const optionsList = collectOptionCodes([unitAttributeTree]);

	const buildNode = (
		node: Record<string, any>,
		isTopLevel = false
	): OptionMsgVO => {

		let attribute: string | null = null;
		let option: string | null | string[] = null;
		let have_sections: any[] = [];
		let belong_section: string | null = null;

		if (node.attribute) {
			const matchedAttr = attrs.find((a: Record<string, any>) =>
				a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() === node.attribute.split(".")[1]
			);
			attribute = matchedAttr ? matchedAttr.code : null;
		}

		// if (node.option) {
		// 	const matchedOption = optionsList.find((o: Record<string, any>) =>
		// 		o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() === node.option.split(".")[1]
		// 	);
		// 	option = matchedOption ? matchedOption.option.code : null;
		// }
		if (node.option) {
			if (Array.isArray(node.option)) {
				// node.option 是数组
				const matchedOptions = node.option
					.map((opt: string) =>
						optionsList.find(
							(o: Record<string, any>) =>
								o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
								opt.split(".")[1]
						)
					)
					.filter(Boolean);

				option = matchedOptions.length
					? matchedOptions.map(o => o.option.code)
					: null;
			} else {
				// node.option 是单值
				const matchedOption = optionsList.find(
					(o: Record<string, any>) =>
						o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
						node.option.split(".")[1]
				);
				option = matchedOption ? matchedOption.option.code : null;
			}
		}

		if (node.have_sections && node.have_sections.length != 0) {
			have_sections = JSON.parse(JSON.stringify(node.have_sections))
			have_sections.forEach((item: any, index: any) => {
				if (item) {
					const matchedAttr = attrs.find((a: Record<string, any>) =>
						a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() === item.split(".")[1]
					);
					have_sections[index] = matchedAttr ? matchedAttr.code : null;
				} else {
					have_sections[index] = null;
				}
			})
		}

		if (node.belong_section) {
			const matchedAttr = attrs.find((a: Record<string, any>) =>
				a.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() === node.belong_section.split(".")[1]
			);
			belong_section = matchedAttr ? matchedAttr.code : null;
		}

		// 获取 attributeMsg
		const attributeMsg =
			attribute
				? getAttributeMsgByAttribute(attribute, unitAttributeTree)
				: {};

		// 获取 options
		const options =
			attribute
				? getOptionsByAttributeCode(attribute, unitAttributeTree)
				: [];

		// 获取 optionMsg
		// const optionMsg =
		// 	option
		// 		? getOptionMsgByOption(option, options)
		// 		: {};
		let optionMsg = {};
		if (option) {
			if (Array.isArray(option)) {
				// option 是数组
				optionMsg = option.map(opt => getOptionMsgByOption(opt, options));
			} else {
				// option 是单值
				optionMsg = getOptionMsgByOption(option, options);
			}
		} else {
			optionMsg = Array.isArray(option) ? [] : {};
		}

		// 递归 children
		const children: OptionMsgVO[] = Array.isArray(node.children)
			? node.children.map((child) => buildNode(child))
			: [];

		return {
			id: crypto.randomUUID(),
			attribute,
			attributeMsg,
			attributeIsDisabled: isTopLevel ? true : false,
			option,
			optionMsg,
			options,
			have_sections,
			belong_section,
			optionIsDisabled: isTopLevel ? true : false,
			children,
			_collapsed: false,
			_isTopLevel: isTopLevel
		};
	};

	// 根节点作为顶层
	return buildNode(profileMsg, true);
};

/** 
 * 根据profile脚本生成profile option msg
 */
export const generateOptionMsgFromProfileScript = (
	profileMsg: Record<string, any>,
	unitAttributeTree: Record<string, any>,
): OptionMsgVO => {
	let optionMsgVO: OptionMsgVO = {
		id: "",
		attribute: "",
		attributeMsg: {},
		attributeIsDisabled: true,
		option: "",
		optionMsg: {},
		options: [],
		have_sections: [],
		belong_section: "",
		optionIsDisabled: true,
		children: [],
		_collapsed: false,
		_isTopLevel: true
	};
	if (
		profileMsg?.script_msg &&
		profileMsg?.script_msg.includes(profileStartAnnotation) &&
		profileMsg?.script_msg.includes(profileEndAnnotation) &&
		profileMsg?.script_msg.includes("profile_msg =")
	) {
		let tempScriptMsg: string = profileMsg?.script_msg;
		let tempProfileOptionMsg: string = tempScriptMsg.split(profileStartAnnotation)[1].split(profileEndAnnotation)[0].split("profile_msg =")[1];
		let profileJsonMsg: Record<string, any> = buildProfileMsgJsonNode(tempProfileOptionMsg);
		optionMsgVO = generateOptionMsgFromProfileJson(profileJsonMsg, unitAttributeTree)
	} else {
		let options = getOptionsByAttributeCode(profileMsg?.profile_attribute_code, unitAttributeTree);
		let attributeMsg = getAttributeMsgByAttribute(profileMsg?.profile_attribute_code, unitAttributeTree);
		let optionMsg = getOptionMsgByOption(profileMsg?.profile_code, options);
		optionMsgVO = {
			id: crypto.randomUUID(),
			attribute: profileMsg?.profile_attribute_code || "",
			attributeMsg: attributeMsg,
			attributeIsDisabled: true,
			option: profileMsg?.profile_code || "",
			optionMsg: optionMsg,
			options: options,
			have_sections: [],
			belong_section: "",
			optionIsDisabled: true,
			children: [],
			_collapsed: false,
			_isTopLevel: true
		};
	};
	return optionMsgVO;
};

/** 
 * 根据profile option msg 生成脚本
 */
export const generateProfileScriptFromProfileOptionMsg = (
	projectAttributeTree: Record<string, any>,
	quoteAttributeTree: Record<string, any>,
	itemAttributeTree: Record<string, any>,
	unitAttributeTree: Record<string, any>,
	profileOptionMsg: OptionMsgVO
): string => {
	// 递归转换
	const transform = (node: OptionMsgVO): OptionMsgDTO => {
		return {
			attribute: node.attribute || "", // VO 里可能是 null，这里用空字符串代替
			option: node.option || "",       // 同上
			have_sections: node.have_sections || [],
			belong_section: node.belong_section || "",
			children: (node.children || []).map(transform)
		};
	};
	const attrs = collectCodes([unitAttributeTree]);
	const options = collectOptionCodes([unitAttributeTree]);
	let newProfileOptionMsg: OptionMsgDTO = transform(profileOptionMsg);

	// 二次处理树，把 attribute 替换成 unit_attributes.classCode 格式
	const replaceAttributes = (node: OptionMsgDTO) => {
		if (node.attribute) {
			const matchAttr = attrs.find((a: Record<string, any>) => a.code === node.attribute);
			if (matchAttr) {
				// 替换 attribute 为 unit_attributes.a.classCode 格式，不加引号
				node.attribute = `unit_attributes.${matchAttr.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()}`;
			}
		}

		// 递归处理 children
		if (node.children && node.children.length > 0) {
			node.children.forEach(replaceAttributes);
		}
	};
	replaceAttributes(newProfileOptionMsg)

	// 三次处理树，把option替换成unit_options.classCode 格式
	// const replaceOptions = (node: OptionMsgDTO) => {
	// 	if (node.option) {
	// 		const matchOpt = options.find((o: Record<string, any>) => o.option.code === node.option);
	// 		if (matchOpt) {
	// 			node.option = `unit_options.${matchOpt.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()}`;
	// 		}
	// 	}
	// 	if (node.children && node.children.length > 0) {
	// 		node.children.forEach(replaceOptions);
	// 	}
	// };
	// replaceOptions(newProfileOptionMsg)

	// 三次处理树，把 option 替换成 unit_options.classCode 格式
	const replaceOptions = (node: OptionMsgDTO) => {
		if (node.option) {
			if (Array.isArray(node.option)) {
				// option 是数组
				node.option = node.option.map((opt: string) => {
					const matchOpt = options.find((o: Record<string, any>) => o.option.code === opt);
					return matchOpt
						? `unit_options.${matchOpt.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()}`
						: opt;
				});
			} else {
				// option 是单值
				const matchOpt = options.find((o: Record<string, any>) => o.option.code === node.option);
				if (matchOpt) {
					node.option = `unit_options.${matchOpt.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()}`;
				}
			}
		}

		if (node.children && node.children.length > 0) {
			node.children.forEach(replaceOptions);
		}
	};
	replaceOptions(newProfileOptionMsg);

	// 四次处理树，把haveSections和belongSection替换成unit_attributes.classCode 格式
	const replaceSections = (node: OptionMsgDTO) => {
		if (node.belong_section) {
			const matchAttr = attrs.find((a: Record<string, any>) => a.code === node.belong_section);
			if (matchAttr) {
				// 替换 attribute 为 unit_attributes.a.classCode 格式，不加引号
				node.belong_section = `unit_attributes.${matchAttr.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()}`;
			}
		} else {
			node.belong_section = `key_words.empty`;
		}
		if (node.have_sections && node.have_sections.length != 0) {
			node.have_sections.forEach((item, index) => {
				if (item) {
					const matchAttr = attrs.find((a: Record<string, any>) => a.code === item);
					if (matchAttr) {
						// 替换 attribute 为 unit_attributes.a.classCode 格式，不加引号
						node.have_sections[index] = `unit_attributes.${matchAttr.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase()}`;
					}
				} else {
					node.have_sections[index] = `key_words.empty`;
				}
			})
		} else {
			node.have_sections = [];
		}
		if (node.children && node.children.length > 0) {
			node.children.forEach(replaceSections);
		}
	};
	replaceSections(newProfileOptionMsg)

	// 递归生成 Python 样式字符串
	const buildPythonCode = (node: OptionMsgDTO, level = 0): string => {
		const indent = "  ".repeat(level); // 当前层缩进
		const childIndent = "  ".repeat(level + 1); // children 外层缩进

		// 如果为空字符串就加双引号，否则直接引用变量
		const attributeStr = node.attribute ? node.attribute : '""';
		let optionStr: string;
		if (!node.option) {
			optionStr = '""';
		} else if (Array.isArray(node.option)) {
			// option 是数组，拼成字符串形式
			optionStr = `[${node.option.join(",")}]`;
		} else {
			// option 是单值
			optionStr = node.option;
		}
		const belongSectionStr = node.belong_section ? node.belong_section : '""';
		let haveSectionsStr: any = "[]"
		if (node.have_sections && node.have_sections.length != 0) {
			haveSectionsStr = `[${node.have_sections.join(",")}]`
		} else {
			haveSectionsStr = "[]"
		}

		let childrenCode = "";
		if (node.children && node.children.length > 0) {
			childrenCode = node.children
				.map(child => buildPythonCode(child, level + 2)) // children 内部缩进更深
				.join(",\n");
			childrenCode = `\n${childrenCode}\n${childIndent}`; // children 的 [] 包裹 +缩进
		}

		return `${indent}{\n${childIndent}attribute: ${attributeStr},\n${childIndent}option: ${optionStr},\n${childIndent}have_sections: ${haveSectionsStr},\n${childIndent}belong_section: ${belongSectionStr},\n${childIndent}children: [${childrenCode}]\n${indent}}`;
	};

	let profileMsgScript: string = "profile_msg = " + buildPythonCode(newProfileOptionMsg);

	let commonScript: string = generateCommonScript();
	let keyWordsClassScript: string = generateKeyWordsClassScript();
	let eventsClassScript: string = generateEventsClassScript();

	let projectAttributesClassScript: string = generateProjectAttributesClassScriptFromTree(projectAttributeTree);
	let quoteAttributesClassScript: string = generateQuoteAttributesClassScriptFromTree(quoteAttributeTree);
	let itemAttributesClassScript: string = generateItemAttributesClassScriptFromTree(itemAttributeTree);
	let unitAttributesClassScript: string = generateUnitAttributesClassScriptFromTree(unitAttributeTree);

	let projectOptionsClassScript: string = generateProjectOptionsClassScriptFromTree(projectAttributeTree);
	let quoteOptionsClassScript: string = generateQuoteOptionsClassScriptFromTree(quoteAttributeTree);
	let itemOptionsClassScript: string = generateItemOptionsClassScriptFromTree(itemAttributeTree);
	let unitOptionsClassScript: string = generateUnitOptionsClassScriptFromTree(unitAttributeTree);

	let ruleMsgScript: string = generateBlankTemplateRuleMsgScript();
	let uiLogicMsgScript: string = generateBlankTemplateUiLogicMsgScript();

	let profileScript: string =
		commonScript +
		keyWordsClassScript +
		eventsClassScript +
		projectAttributesClassScript +
		quoteAttributesClassScript +
		itemAttributesClassScript +
		unitAttributesClassScript +
		projectOptionsClassScript +
		quoteOptionsClassScript +
		itemOptionsClassScript +
		unitOptionsClassScript +
		`${profileStartAnnotation}\n` +
		profileMsgScript +
		`\n${profileEndAnnotation}\n` +
		`\n${ruleMsgStartAnnotation}` +
		ruleMsgScript +
		`\n${ruleMsgEndAnnotation}\n` +
		`\n${uiLogicMsgStartAnnotation}\n` +
		uiLogicMsgScript +
		`\n${uiLogicMsgEndAnnotation}\n`

	console.log(profileScript, 'profileScript')
	return profileScript;
};

/** 
 * 给option item添加子节点
 */
export const addSubOption = (optionItemMsg: OptionMsgVO): OptionMsgVO => {
	let subOptionMsgVO = {
		id: crypto.randomUUID(),
		attribute: null,
		attributeMsg: {},
		attributeIsDisabled: false,
		option: null,
		optionMsg: {},
		options: [],
		have_sections: [],
		belong_section: "",
		optionIsDisabled: false,
		children: [],
		_collapsed: false,
		_isTopLevel: false
	};
	optionItemMsg.children.push(subOptionMsgVO)
	return optionItemMsg
};

/** 
 * 给option item 添加兄弟节点
 */
export const addSiblingOption = (
	optionItemMsg: OptionMsgVO,
	profileOptionMsg: OptionMsgVO
): OptionMsgVO => {

	const dfs = (node: OptionMsgVO): OptionMsgVO => {
		if (!node.children || node.children.length === 0) return { ...node };

		// 查找当前节点在 children 中的索引
		const index = node.children.findIndex(c => c.id === optionItemMsg.id);
		if (index !== -1) {
			// 找到了目标节点，在其后插入兄弟节点
			const newSibling: OptionMsgVO = {
				id: crypto.randomUUID(),
				attribute: optionItemMsg.attribute,
				attributeMsg: optionItemMsg.attributeMsg,
				attributeIsDisabled: false,
				option: null,
				optionMsg: {},
				options: optionItemMsg.options,
				have_sections: [],
				belong_section: "",
				optionIsDisabled: false,
				children: [],
				_collapsed: false,
				_isTopLevel: false
			};

			const newChildren = [
				...node.children.slice(0, index + 1),
				newSibling,
				...node.children.slice(index + 1)
			];

			return { ...node, children: newChildren };
		}

		// 递归处理子节点
		return {
			...node,
			children: node.children.map(dfs)
		};
	};

	return dfs(profileOptionMsg);
};

/**
 * 递归复制节点及子孙，并重新生成 id
 */
export const deepCopyWithNewId = (node: OptionMsgVO): OptionMsgVO => {
	return {
		...node,
		id: crypto.randomUUID(),
		children: (node.children || []).map(deepCopyWithNewId)
	};
};

/** 
 * 复制节点
 */
export const copyItem = (
	optionItemMsg: OptionMsgVO,
	profileOptionMsg: OptionMsgVO
): OptionMsgVO => {
	const dfs = (node: OptionMsgVO): OptionMsgVO => {
		if (!node.children || node.children.length === 0) return { ...node };

		const index = node.children.findIndex(c => c.id === optionItemMsg.id);

		if (index !== -1) {
			// 找到目标节点，复制节点
			const newNode = deepCopyWithNewId(optionItemMsg);

			const newChildren = [
				...node.children.slice(0, index + 1),
				newNode,
				...node.children.slice(index + 1)
			];

			return { ...node, children: newChildren };
		}

		// 递归处理子节点
		return { ...node, children: node.children.map(dfs) };
	};

	return dfs(profileOptionMsg);
};

/** 
 * 删除节点
 */
export const deleteItem = (
	optionItemMsg: OptionMsgVO,
	profileOptionMsg: OptionMsgVO
): OptionMsgVO => {
	const dfs = (node: OptionMsgVO): OptionMsgVO => {
		// 递归处理 children
		const newChildren = (node.children || [])
			.map(child => {
				if (child.id === optionItemMsg.id) {
					// 找到目标节点，删除它
					return null;
				}
				return dfs(child);
			})
			.filter((c): c is OptionMsgVO => c !== null); // 删除 null 节点

		return { ...node, children: newChildren };
	};

	return dfs(profileOptionMsg);
};

/** 
 * 更新Option item msg
 */
export const updateOption = (optionItemMsg: OptionMsgVO, profileOptionMsg: OptionMsgVO): OptionMsgVO => {
	// 如果当前节点匹配 id，则直接返回 optionItemMsg
	if (profileOptionMsg.id === optionItemMsg.id) {
		return { ...optionItemMsg };
	}

	// 如果有 children，递归处理
	let updatedChildren: OptionMsgVO[] = [];
	if (profileOptionMsg.children && profileOptionMsg.children.length > 0) {
		updatedChildren = profileOptionMsg.children.map(child =>
			updateOption(optionItemMsg, child)
		);
	}

	// 返回新的节点对象（保持原对象的其它属性不变，只更新 children）
	return {
		...profileOptionMsg,
		children: updatedChildren
	};

};

/** 
 * 根据attribute code和attribute tree获取options
 */
export const getOptionsByAttributeCode = (attributeCode: string, attributeTree: Record<string, any>): any[] => {

	// 如果树为空，直接返回空数组
	if (!attributeTree) return [];

	// 先检查当前节点
	if (attributeTree.code === attributeCode) {
		return attributeTree.options || [];
	}

	// 如果有 children，递归查找
	if (attributeTree.children && attributeTree.children.length > 0) {
		for (const child of attributeTree.children) {
			const result = getOptionsByAttributeCode(attributeCode, child);
			if (result.length > 0) {
				return result;
			}
		}
	}

	// 没找到匹配节点
	return []

};

/**
 * 从树里找到 attribute="unit$product_type" 并携带父节点数据
 */
export const findProductTypeWithParent = (treeObj: OptionMsgVO) => {
	if (!treeObj || !Array.isArray(treeObj.children)) return [];

	// 第一层 children，找 attribute === "unit$product"
	const productNode = treeObj.children.find(
		child => child.attribute === "unit$product"
	);
	if (!productNode || !Array.isArray(productNode.children)) return [];

	// 第二层 children，找 attribute === "unit$product_type"
	const result = productNode.children
		.filter(child => child.attribute === "unit$product_type")
		.map(child => ({
			parent: productNode, // 第一层 node
			...child              // 第二层 node 数据
		}));

	return result;
};

export const pickProductProductTypeOpen = (root: OptionMsgVO): OptionMsgVO => {
	// 复制顶级节点，保证不破坏原数据
	const newRoot: OptionMsgVO = { ...root };

	// 第一层：找到所有 product 节点
	const productNodes =
		newRoot.children
			?.filter(child => child.attribute === "unit$product")
			.map(productNode => {
				// 第二层：找到所有 product_type 节点
				const productTypeNodes =
					productNode.children
						?.filter(child => child.attribute === "unit$product_type")
						.map(productTypeNode => {
							// 第三层：找到所有 unit$operability 节点
							const openNodes =
								productTypeNode.children
									?.filter(child => child.attribute === "unit$operability")
									.map(openNode => ({
										...openNode,
										children: [], // 截断
									})) ?? [];

							return {
								...productTypeNode,
								children: openNodes,
							};
						}) ?? [];

				return {
					...productNode,
					children: productTypeNodes,
				};
			}) ?? [];

	// 如果第一层都没找到，children = []
	return {
		...newRoot,
		children: productNodes.length > 0 ? productNodes : [],
	};
};

/**
 * 从树里找到 belong_section="section"的数据
 */
export const findTopLevelBySection = (
	section: string,
	tree: OptionMsgVO[]
): OptionMsgVO[] => {
	const result: OptionMsgVO[] = [];

	const dfs = (nodes: OptionMsgVO[]): boolean => {
		let foundAtThisLevel = false;

		for (const node of nodes) {
			if (node.belong_section === section) {
				foundAtThisLevel = true;
				result.push(JSON.parse(JSON.stringify(node)));
			}
		}

		// 如果这一层已经找到了，就不再向下递归
		if (foundAtThisLevel) {
			return true;
		}

		// 否则继续往下一层找
		for (const node of nodes) {
			if (node.children && node.children.length > 0) {
				if (dfs(node.children)) {
					return true;
				}
			}
		}

		return false;
	};

	dfs(tree);
	return result;
};


/**
 * 递归遍历unit attribute tree data, 找到is_set_option_library==true的数据并组装成list返回
 */
export const collectOptionLibraryNodes = (tree: Record<string, any>) => {
	const result: any[] = [];

	const traverse = (node: Record<string, any>) => {
		if (!node) return;

		// 如果是数组，逐个处理
		if (Array.isArray(node)) {
			node.forEach(traverse);
			return;
		}

		// 命中条件就 push
		if (node.is_set_option_library === true) {
			result.push(node);
		}

		// 递归 children
		if (Array.isArray(node.children)) {
			node.children.forEach(traverse);
		}
	};

	traverse(tree);
	return result;
};

/**
 * 递归遍历树形数据，判断每条数据是否是本层级的最后一个
 */
export const markLastNodeAtEachLevel = (tree: OptionMsgVO[]) => {
	if (!Array.isArray(tree) || tree.length === 0) return tree;

	tree.forEach((item, index) => {
		item._isLastOneAtThisLevel = index === tree.length - 1;

		if (Array.isArray(item.children) && item.children.length > 0) {
			markLastNodeAtEachLevel(item.children);
		}
	});

	return tree;
};