import { Line } from "react-konva";

const AngleRestrictedLine = ({ startX, startY, mouseX, mouseY }:any) => {
    // 计算终点位置
    const calculateRestrictedEndPoint = (startX:any, startY:any, endX:any, endY:any) => {
        const dx = endX - startX;
        const dy = endY - startY;

        // 计算角度（弧度制）
        let angle = Math.atan2(dy, dx);

        // 转换弧度为度数
        let angleInDegrees = (angle * 180) / Math.PI;

        // 四舍五入到最近的 45 度倍数
        angleInDegrees = Math.round(angleInDegrees / 45) * 45;

        // 转换回弧度
        angle = (angleInDegrees * Math.PI) / 180;

        // 根据角度计算约束后的终点
        const distance = Math.sqrt(dx * dx + dy * dy); // 保持原有长度
        const restrictedEndX = startX + Math.cos(angle) * distance;
        const restrictedEndY = startY + Math.sin(angle) * distance;

        return { x: restrictedEndX, y: restrictedEndY };
    };

    // 计算受限的终点
    const { x: restrictedX, y: restrictedY } = calculateRestrictedEndPoint(
        startX,
        startY,
        mouseX,
        mouseY
    );

    return (
        <Line
            points={[startX, startY, restrictedX, restrictedY]}
            stroke="rgba(42,94,204,0.7)"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
            dash={[10, 5]}
        />
    );
};

export default AngleRestrictedLine;
