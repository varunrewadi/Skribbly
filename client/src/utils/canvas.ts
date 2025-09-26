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
    case 'text': {
      // Handle negative dimensions by normalizing the bounds
      const minX = Math.min(ex, ex + width);
      const maxX = Math.max(ex, ex + width);
      const minY = Math.min(ey, ey + height);
      const maxY = Math.max(ey, ey + height);
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
    
    case 'circle': {
      // Handle negative dimensions by using absolute values
      const centerX = ex + width / 2;
      const centerY = ey + height / 2;
      const radiusX = Math.abs(width) / 2;
      const radiusY = Math.abs(height) / 2;
      
      // Avoid division by zero
      if (radiusX === 0 || radiusY === 0) return false;
      
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      return dx * dx + dy * dy <= 1;
    }
    
    case 'line': {
      const x1 = ex;
      const y1 = ey;
      const x2 = ex + width;
      const y2 = ey + height;
      const distance = distanceToLine(x, y, x1, y1, x2, y2);
      return distance <= Math.max(element.strokeWidth + 5, 8); // Minimum 8px tolerance for thin lines
    }
    
    case 'freehand': {
      if (!element.points || element.points.length === 0) return false;
      
      // For single point, check distance from that point
      if (element.points.length === 1) {
        const p = element.points[0];
        const distance = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
        return distance <= Math.max(element.strokeWidth + 5, 8);
      }
      
      // Check if point is near any line segment in the freehand path
      for (let i = 0; i < element.points.length - 1; i++) {
        const p1 = element.points[i];
        const p2 = element.points[i + 1];
        const distance = distanceToLine(x, y, p1.x, p1.y, p2.x, p2.y);
        if (distance <= Math.max(element.strokeWidth + 5, 8)) return true;
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
  // Vector from point 1 to point 2
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // If it's essentially a point (zero length line)
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared < 0.0001) {
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }
  
  // Calculate the parameter t that represents the projection of point P onto the line
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  
  // Find the closest point on the line segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  
  // Return the distance from the point to the closest point on the line segment
  return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
};