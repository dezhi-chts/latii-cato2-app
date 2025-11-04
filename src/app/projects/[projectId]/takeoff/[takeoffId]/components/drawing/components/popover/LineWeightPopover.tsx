import React, {useEffect} from 'react';
import {Radio, Space, Button} from 'antd';

interface LineWeightPopoverProps {
    onConfirm: (weight: number) => void;
    onClose: () => void;
    overLine: any;
    element: any;
}

export const LineWeightPopoverContent: React.FC<LineWeightPopoverProps> = ({
                                                                               onConfirm,
    element,
                                                                               onClose,
                                                                               overLine
                                                                           }) => {
    const getInitialWeight = () => {

        return overLine.weight || 1;
    };

    const [selectedWeight, setSelectedWeight] = React.useState<number>(getInitialWeight());

    useEffect(() => {
        setSelectedWeight(getInitialWeight());
    }, [overLine]);

    return (
        <div className="p-2 min-w-28 ">
            <h6>
                Current Weight: {overLine.weight}
            </h6>
            <Radio.Group
                value={selectedWeight}
                onChange={(e) => setSelectedWeight(e.target.value)}
                size="small"
            >
                <Space direction="vertical" size="small">
                    {
                        !element.type.startsWith('Line') && (
                            <Radio value={0}>weight 0</Radio>
                        )
                    }
                    {
                        overLine.weight > 1 && !element.type.startsWith('Line') && (
                            <>
                                <Radio value={0.3}>weight 0-InnerBorder</Radio>
                                <Radio value={1.2}>weight 0-Left/Top</Radio>
                                <Radio value={1.1}>weight 0-Right/Bottom</Radio>
                                <Radio value={1}>weight 1</Radio>
                                {/*<Radio value={1.2}>weight 1-Left/Top</Radio>*/}
                                {/*<Radio value={1.1}>weight 1-Right/Bottom</Radio>*/}
                                <Radio value={3}>weight 3</Radio>
                            </>
                        )
                    }
                    {
                        element.type.startsWith('Line') && (
                            <>
                                <Radio value={0.3}>weight 0-InnerBorder</Radio>
                                <Radio value={1.2}>weight 0-Left/Top</Radio>
                                <Radio value={1.1}>weight 0-Right/Bottom</Radio>
                                <Radio value={1}>weight 1</Radio>
                                <Radio value={2}>weight 2</Radio>
                                {/*<Radio value={3}>weight 3</Radio>*/}
                            </>
                        )
                    }
                </Space>
            </Radio.Group>
            <div className=" flex gap-2 mt-2 justify-end ">
                <Button
                    size="small"
                    onClick={() => onConfirm(selectedWeight)}
                    type="primary"
                >
                    Confirm
                </Button>
                <Button
                    size="small"
                    onClick={onClose}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}; 