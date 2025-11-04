import React, { useState } from 'react';
import {Modal, Form, Input, ColorPicker, message} from 'antd';
import {useSetting} from "../../context/settingContext";

interface RenderSettingsProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (settings: RenderSettings) => void;
    initialSettings: RenderSettings;
}

export interface RenderSettings {
    frameBorder: number;
    frameColor: string;
    casementBorder: number;
    casementColor: string;
}

export const RenderSettingsPopover: React.FC<RenderSettingsProps> = ({
                                                                         visible,
                                                                         onClose,
                                                                         onConfirm,
                                                                         initialSettings
                                                                     }) => {
    const { value } = useSetting()
    const [settings, setSettings] = useState<RenderSettings>({
        ...initialSettings,
        frameBorder: initialSettings.frameBorder * value.sizeMultiples,
        casementBorder: initialSettings.casementBorder * value.sizeMultiples,
    });

    const handleChange = (field: keyof RenderSettings, value: any) => {
        // if (field === 'frameBorder' && (typeof value === 'number' && value <= 0)) {
        //     return;
        // }
        //
        // if (field === 'casementBorder' && (typeof value === 'number' && value < 0)) {
        //     return;
        // }

        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleConfirm = () => {
        if (settings.frameBorder < 1) {
            message.error('Frame border width must be greater than 0');
            return;
        }

        if (settings.casementBorder < 0) {
            message.error('Casement border width cannot be less than 0');
            return;
        }

        onConfirm({
            ...settings,
            frameBorder: settings.frameBorder / value.sizeMultiples,
            casementBorder: settings.casementBorder / value.sizeMultiples,
        });
    };

    return (
        <Modal
            title="Render Settings"
            open={visible}
            onOk={handleConfirm}
            onCancel={onClose}
            okText="Confirm"
            cancelText="Cancel"
            width={300}
        >
            <Form layout="vertical">
                <Form.Item label="Frame Border Width" required>
                    <Input
                        type="number"
                        // min={1}
                        step={5}
                        value={settings.frameBorder}
                        onChange={e => {
                            const value = parseFloat(e.target.value);
                            // if (!isNaN(value)) {
                                handleChange('frameBorder', value);
                            // }
                        }}
                        suffix="mm"
                    />
                </Form.Item>
                <Form.Item label="Frame Border Color">
                    {/*<ColorPicker*/}
                    {/*    value={settings.frameColor}*/}
                    {/*    onChange={(color) => handleChange('frameColor', color.toHexString())}*/}
                    {/*    showText*/}
                    {/*    allowClear*/}
                    {/*    format="hex"*/}
                    {/*/>*/}
                    <Input
                        type="color"
                        value={settings.frameColor}
                        onChange={e => handleChange('frameColor', e.target.value)}
                        style={{width: '100%', cursor: 'pointer'}}
                    />
                </Form.Item>
                <Form.Item label="Casement Border Width">
                    <Input
                        type="number"
                        // min={0}
                        step={5}
                        value={settings.casementBorder}
                        onChange={e => {
                            const value = parseFloat(e.target.value);
                            // if (!isNaN(value)) {
                                handleChange('casementBorder', value);
                            // }
                        }}
                        suffix="mm"
                    />
                </Form.Item>
                <Form.Item label="Casement Border Color">
                    {/*<ColorPicker*/}
                    {/*    value={settings.casementColor}*/}
                    {/*    onChange={(color) => handleChange('casementColor', color.toHexString())}*/}
                    {/*    showText*/}
                    {/*    allowClear*/}
                    {/*    format="hex"*/}
                    {/*/>*/}
                    <Input
                        type="color"
                        value={settings.casementColor}
                        onChange={e => handleChange('casementColor', e.target.value)}
                        style={{width: '100%', cursor: 'pointer'}}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};