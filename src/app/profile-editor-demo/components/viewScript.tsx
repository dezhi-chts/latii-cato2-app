import Editor from '@monaco-editor/react';

const ViewScriptCom = (props: any) => {

	return (
		<div className="">
			<Editor
				height="650px"
				defaultLanguage="python"
				theme="vs-dark"
				value={props.scriptMsg}
			/>
		</div>
	);
};

export default ViewScriptCom;