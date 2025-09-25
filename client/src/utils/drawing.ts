import type { Element } from '../types/canvas';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const createElement = (
  type: Element['type'],
  x: number,
  y: number,
  width = 0,
  height = 0,
  strokeColor = '#000000',
  fillColor = 'transparent',
  strokeWidth = 2
): Element => ({
  id: generateId(),
  type,
  x,
  y,
  width,
  height,
  strokeColor,
  fillColor,
  strokeWidth,
  angle: 0,
});

export const drawElement = (
  ctx: CanvasRenderingContext2D,
  element: Element,
  isSelected = false
): void => {
  ctx.save();
  
  // Apply rotation if needed
  if (element.angle && element.angle !== 0) {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((element.angle * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }
  
  ctx.strokeStyle = element.strokeColor;
  ctx.fillStyle = element.fillColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  switch (element.type) {
    case 'rectangle':
      ctx.beginPath();
      ctx.rect(element.x, element.y, element.width, element.height);
      if (element.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
      break;
      
    case 'circle':
      ctx.beginPath();
      ctx.ellipse(
        element.x + element.width / 2,
        element.y + element.height / 2,
        Math.abs(element.width) / 2,
        Math.abs(element.height) / 2,
        0,
        0,
        2 * Math.PI
      );
      if (element.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
      break;
      
    case 'line':
      ctx.beginPath();
      ctx.moveTo(element.x, element.y);
      ctx.lineTo(element.x + element.width, element.y + element.height);
      ctx.stroke();
      break;
      
    case 'freehand':
      if (element.points && element.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        for (let i = 1; i < element.points.length; i++) {
          ctx.lineTo(element.points[i].x, element.points[i].y);
        }
        ctx.stroke();
      }
      break;
      
    case 'text':
      ctx.font = `${element.strokeWidth * 8}px Arial`;
      ctx.fillStyle = element.strokeColor;
      ctx.fillText(element.text || 'Text', element.x, element.y + element.strokeWidth * 8);
      break;
  }
  
  // Draw selection border
  if (isSelected) {
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      element.x - 5,
      element.y - 5,
      element.width + 10,
      element.height + 10
    );
    ctx.setLineDash([]);
  }
  
  ctx.restore();
};