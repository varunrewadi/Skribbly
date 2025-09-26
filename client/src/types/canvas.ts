export type Tool = 'selection' | 'pan' | 'rectangle' | 'circle' | 'line' | 'freehand' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface Element {
  id: string;
  type: Exclude<Tool, 'selection'>;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  points?: Point[]; // For freehand drawing
  text?: string; // For text elements
  angle?: number; // For rotation
}

export interface ViewportState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface CanvasState {
  elements: Element[];
  selectedElementId: string | null;
  currentTool: Tool;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

export interface DrawingState {
  isDrawing: boolean;
  currentElement: Element | null;
  startPoint: Point | null;
}

export interface PanState {
  isPanning: boolean;
  lastPanPoint: Point | null;
}