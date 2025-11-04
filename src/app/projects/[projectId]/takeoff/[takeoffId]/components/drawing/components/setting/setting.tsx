import React from 'react';
import { ISashConfig } from '../../data/multipleSlidingSash';
import { useSetting } from '../../context/settingContext';
import Image from "next/image";
import { winType } from '../../datas';

interface SettingsProps {
    type?: winType;
    setType?: (type: winType) => void;
    sashConfigs?: ISashConfig[];
    setSashConfigs?: (configs: ISashConfig[]) => void;
    onExport?: () => void;
    onExportImage?: () => void;
    onImport?: () => void;
    onRemove?: () => void;
    undo?: () => void;
    redo?: () => void;
    importValue?: string;
    setImportValue?: (value: string) => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
}

const Settings: React.FC<SettingsProps> = ({
                                               type,
                                               setType,
                                               sashConfigs,
                                               setSashConfigs,
                                               onExport,
                                               onImport,
                                               onRemove,
                                               importValue,
                                               setImportValue,
                                               undo,redo,
                                                onZoomIn,
                                                onZoomOut,
                                               onExportImage
                                           }) => {
    const { value, setValue } = useSetting();

    // const handleChange = (data: any, field: string) => {
    //     let params: any = value;
    //     params[field] = data;
    //     setValue({ ...params });
    // };
    //
    // const addSashConfig = () => {
    //     setSashConfigs([...sashConfigs, { lockEdge: 3, direction: 'right', zIndex: 0 }]);
    //     console.log(sashConfigs);
    // };
    //
    // const removeSashConfig = (index: number) => {
    //     setSashConfigs(sashConfigs.filter((_, i) => i !== index));
    // };
    //
    // const updateSashConfig = (index: number, field: keyof ISashConfig, value: any) => {
    //     const newConfigs = [...sashConfigs];
    //     newConfigs[index] = { ...newConfigs[index], [field]: value };
    //     setSashConfigs(newConfigs);
    // };

    return (
        <div className='absolute top-2 right-2 z-[999]' >
            <div className='flex justify-center'>
                {/*<button*/}
                {/*    onClick={() => setType(type === 'frame' ? '' : 'frame')}*/}
                {/*    style={{border: type == 'frame' ? '1px solid #f00' : ''}}*/}
                {/*>*/}
                {/*    Frame*/}
                {/*</button>*/}
                {/*<button*/}
                {/*    onClick={() => setType(type === 'midting' ? '' : 'midting')}*/}
                {/*    style={{border: type == 'midting' ? '1px solid #f00' : ''}}*/}
                {/*>*/}
                {/*    Mullion*/}
                {/*</button>*/}
                {/*<button*/}
                {/*    onClick={() => setType(type === 'operableSash' ? '' : 'operableSash')}*/}
                {/*    style={{border: type == 'operableSash' ? '1px solid #f00' : ''}}*/}
                {/*>*/}
                {/*    Operable Sash*/}
                {/*</button>*/}
                {/*<button*/}
                {/*    onClick={() => setType(type === 'multipOperableSash' ? '' : 'multipOperableSash')}*/}
                {/*    style={{border: type == 'multipOperableSash' ? '1px solid #f00' : ''}}*/}
                {/*>*/}
                {/*    Multip Operable Sash*/}
                {/*</button>*/}
                {/*<button*/}
                {/*    onClick={() => setType(type === 'slidingSash' ? '' : 'slidingSash')}*/}
                {/*    style={{border: type == 'slidingSash' ? '1px solid #f00' : ''}}*/}
                {/*>*/}
                {/*    Sliding Sash*/}
                {/*</button>*/}
                {/*<button*/}
                {/*    onClick={() => setType(type === 'pivotSash' ? '' : 'pivotSash')}*/}
                {/*    style={{border: type == 'pivotSash' ? '1px solid #f00' : ''}}*/}
                {/*>*/}
                {/*    Pivot Sash*/}
                {/*</button>*/}
                {/*<button*/}
                {/*    onClick={() => setType(type === 'slideCornerWindow' ? '' : 'slideCornerWindow')}*/}
                {/*    style={{border: type == 'slideCornerWindow' ? '1px solid #f00' : ''}}*/}
                {/*>*/}
                {/*    Slide Corner Window*/}
                {/*</button>*/}
                {/*<button*/}
                {/*    onClick={() => setType(type === 'foldingCornerWindow' ? '' : 'foldingCornerWindow')}*/}
                {/*    style={{border: type == 'foldingCornerWindow' ? '1px solid #f00' : ''}}*/}
                {/*>*/}
                {/*    Folding Corner Window*/}
                {/*</button>*/}
                {/*<button onClick={() => setType('')} style={{marginLeft: 10}}>*/}
                {/*    Cancel Select Tool*/}
                {/*</button>*/}
                {/*<button onClick={onRemove} style={{marginLeft: 20}}>*/}
                {/*    Remove*/}
                {/*</button>*/}
                {/*<button onClick={onExport} style={{marginLeft: 20}}>*/}
                {/*    Export*/}
                {/*</button>*/}
                {/*<button onClick={onExportImage}>ExportImage</button>*/}

                {/*<input*/}
                {/*    style={{marginLeft: 20}}*/}
                {/*    value={importValue}*/}
                {/*    onChange={e => setImportValue(e.target.value)}*/}
                {/*    type="text"*/}
                {/*    placeholder="Import Value"*/}
                {/*/>*/}
                {/*<button onClick={onImport}>import</button>*/}

                {/*<div style={{marginLeft: 20}}>*/}
                {/*    <label htmlFor="shape-select">Set Style:</label>*/}
                {/*    <select*/}
                {/*        id="shape-select"*/}
                {/*        value={value.lock}*/}
                {/*        onChange={(e) => handleChange(e.target.value, 'lock')}*/}
                {/*        style={{padding: '8px', fontSize: '14px', margin: '8px 0'}}*/}
                {/*    >*/}
                {/*        <option value={'0'}>Unlock</option>*/}
                {/*        <option value={'1'}>Lock</option>*/}
                {/*    </select>*/}
                {/*</div>*/}
                {/*<div style={{marginLeft: 20}}>*/}
                {/*    <label htmlFor="shape-select">Set Line: </label>*/}
                {/*    <select*/}
                {/*        id="shape-select"*/}
                {/*        value={value.line}*/}
                {/*        onChange={(e) => handleChange(e.target.value, 'line')}*/}
                {/*        style={{padding: '8px', fontSize: '14px', margin: '8px 0'}}*/}
                {/*    >*/}
                {/*        <option value="straight">Straight</option>*/}
                {/*        <option value="circle">Circle</option>*/}
                {/*    </select>*/}
                {/*</div>*/}
                {/*<div style={{marginLeft: 20}}>*/}
                {/*    <label htmlFor="shape-select">Line Width: </label>*/}
                {/*    <input*/}
                {/*        value={value.lineWidth}*/}
                {/*        onChange={e => handleChange(Number(e.target.value), "lineWidth")}*/}
                {/*        type="number"*/}
                {/*    />*/}
                {/*</div>*/}

                {/*<div  className={' bg-[#eee] w-16 h-6 rounded-3xl flex items-center '}>*/}
                {/*    <span  onClick={undo} className={' flex-1 flex items-center justify-center cursor-pointer'}>*/}
                {/*        <Image*/}
                {/*            src="/assets/icons/arrow-back.svg"*/}
                {/*            alt="undo"*/}
                {/*            height={18}*/}
                {/*            width={18}*/}
                {/*            className="w-auto"*/}
                {/*        />*/}
                {/*    </span>*/}
                {/*    <em className={'bg-white w-0.5 h-full'}></em>*/}
                {/*    <span  onClick={redo} className={' flex-1 flex items-center justify-center cursor-pointer'}>*/}
                {/*        <Image*/}
                {/*            src="/assets/icons/arrow-back.svg"*/}
                {/*            alt="redo"*/}
                {/*            height={18}*/}
                {/*            width={18}*/}
                {/*            className="w-auto -scale-x-100 "*/}
                {/*        />*/}
                {/*    </span>*/}
                {/*</div>*/}

                {/*<div className={' bg-[#eee] w-16 h-6 rounded-3xl flex items-center ml-2 '}>*/}
                {/*    <span onClick={onZoomOut} className={'h-full flex-1 flex items-center justify-center cursor-pointer'}>*/}
                {/*        <Image*/}
                {/*            src="/assets/icons/dash.svg"*/}
                {/*            alt=""*/}
                {/*            height={18}*/}
                {/*            width={18}*/}
                {/*            className="w-auto "*/}
                {/*        />*/}
                {/*    </span>*/}
                {/*    <em className={'bg-white w-0.5 h-full'}></em>*/}
                {/*    <span onClick={onZoomIn} className={'h-full flex-1 flex items-center justify-center cursor-pointer'}>*/}
                {/*        <Image*/}
                {/*            src="/assets/icons/add-gray.svg"*/}
                {/*            alt=""*/}
                {/*            height={20}*/}
                {/*            width={20}*/}
                {/*            className="w-auto "*/}
                {/*        />*/}
                {/*    </span>*/}
                {/*</div>*/}
            </div>

            {/*<div style={{position: "fixed", top: 20, right: 20, border: '1px solid #ccc', padding: 10, zIndex: 100}}>*/}
            {/*    <h4>Sliding Sash Configs</h4>*/}
            {/*    <button onClick={addSashConfig}>Add Config</button>*/}
            {/*    <div style={{maxHeight: '600px', overflowY: 'auto' }}>*/}
            {/*        {sashConfigs.map((config, index) => (*/}
            {/*            <div key={index} style={{marginBottom: 10, padding: 5, border: '1px solid #eee'}}>*/}
            {/*                <div>*/}
            {/*                    <label>Direction: </label>*/}
            {/*                    <select*/}
            {/*                        value={config.direction}*/}
            {/*                        onChange={(e) => updateSashConfig(index, 'direction', e.target.value)}*/}
            {/*                    >*/}
            {/*                        <option value="fixed">Fixed</option>*/}
            {/*                        <option value="left">Left</option>*/}
            {/*                        <option value="right">Right</option>*/}
            {/*                        <option value="leftRight">Left-Right</option>*/}
            {/*                    </select>*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <label>FLex: </label>*/}
            {/*                    <input*/}
            {/*                        type="number"*/}
            {/*                        value={config.flex}*/}
            {/*                        onChange={(e) => updateSashConfig(index, 'flex', Number(e.target.value))}*/}
            {/*                        min="0"*/}
            {/*                    />*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <label>Level: </label>*/}
            {/*                    <input*/}
            {/*                        type="number"*/}
            {/*                        value={config.zIndex}*/}
            {/*                        onChange={(e) => updateSashConfig(index, 'zIndex', Number(e.target.value))}*/}
            {/*                        min="0"*/}
            {/*                    />*/}
            {/*                </div>*/}
            {/*                <button onClick={() => removeSashConfig(index)}>Remove</button>*/}
            {/*            </div>*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*</div>*/}
        </div>
    );
};

export default Settings;