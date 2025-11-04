import React from 'react';

interface InfoBarProps {
    x: number;
    y: number;
    scale: number;
}

export const InfoBar: React.FC<InfoBarProps> = ({ x, y, scale }) => {
    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                height: '28px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: '12px',
                fontSize: '12px',
                color: '#fff',
                userSelect: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000
            }}
        >
            <div>X: {Math.round(x)}</div>
            <div style={{ 
                width: '1px', 
                height: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.2)' 
            }} />
            <div>Y: {Math.round(y)}</div>
        </div>
    );
}; 