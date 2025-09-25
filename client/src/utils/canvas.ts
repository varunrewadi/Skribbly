import type { Element } from '../types/canvas';

export const getElementAtPosition = (
  x: number,
  y: number,
  elements: Element[]
): Element | null => {
  // Check elements in reverse order (top to bottom)
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    
    if (isPointInElement(x, y, element)) {
      return element;
    }
  }
  return null;
};

export const isPointInElement = (x: number, y: number, element: Element): boolean => {
  const { x: ex, y: ey, width, height, type } = element;
  
  switch (type) {
    case 'rectangle':
    case 'text':
      return x >= ex && x <= ex + width && y >= ey && y <= ey + height;
    
    case 'circle': {
      const centerX = ex + width / 2;
      const centerY = ey + height / 2;
      const radiusX = width / 2;
      const radiusY = height / 2;
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      return dx * dx + dy * dy <= 1;
    }
    
    case 'line': {
      const distance = distanceToLine(x, y, ex, ey, ex + width, ey + height);
      return distance <= element.strokeWidth + 5; // 5px tolerance
    }
    
    case 'freehand': {
      if (!element.points || element.points.length === 0) return false;
      // Check if point is near any line segment in the freehand path
      for (let i = 0; i < element.points.length - 1; i++) {
        const p1 = element.points[i];
        const p2 = element.points[i + 1];
        const distance = distanceToLine(x, y, p1.x, p1.y, p2.x, p2.y);
        if (distance <= element.strokeWidth + 5) return true;
      }
      return false;
    }
    
    default:
      return false;
  }
};

const distanceToLine = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return Math.sqrt(A * A + B * B);
  
  let param = dot / lenSq;
  
  if (param < 0) {
    return Math.sqrt(A * A + B * B);
  } else if (param > 1) {
    const dx = px - x2;
    const dy = py - y2;
    return Math.sqrt(dx * dx + dy * dy);
  } else {
    const dx = px - (x1 + param * C);
    const dy = py - (y1 + param * D);
    return Math.sqrt(dx * dx + dy * dy);
  }
};