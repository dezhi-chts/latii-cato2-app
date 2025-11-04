import React, {DragEventHandler, useState} from 'react';
import styles from './index.module.css';

export interface IWindowTemplate {
    id: string;
    name: string;
    type: string;
    thumbnail: string; // 缩略图URL
    data: any; // 窗户的具体数据
}

interface WindowListProps {
    templates: IWindowTemplate[];
    onDragStart: (template: IWindowTemplate) => void;
    onDrop: DragEventHandler;
}

const Index: React.FC<WindowListProps> = ({ templates, onDragStart, onDrop }) => {
    const [activeType, setActiveType] = useState<'Window' | 'Door'>('Window');

    const filteredTemplates = templates.filter(template => template.type === activeType);

    return (
        <div className={styles.container}>
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tabButton} ${activeType === 'Window' ? styles.active : ''}`}
                    onClick={() => setActiveType('Window')}
                >
                    Window
                </button>
                <button
                    className={`${styles.tabButton} ${activeType === 'Door' ? styles.active : ''}`}
                    onClick={() => setActiveType('Door')}
                >
                    Door
                </button>
            </div>
            <div className={styles.list}>
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className={styles.item}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('application/json', JSON.stringify(template));
                            onDragStart(template);
                        }}
                        onDragEnd={onDrop}
                    >
                        <div className={styles.thumbnail}>
                            {template.thumbnail ? (
                                <img src={template.thumbnail} alt={template.name}/>
                            ) : (
                                <div className={styles.placeholder}>No Image</div>
                            )}
                        </div>
                        <div className={styles.name}>{template.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Index;