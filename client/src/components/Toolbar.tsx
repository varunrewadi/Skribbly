import React from "react";
import type { Tool, CanvasState } from "../types/canvas";

interface ToolbarProps {
  canvasState: CanvasState;
  onToolChange: (tool: Tool) => void;
  onStrokeColorChange: (color: string) => void;
  onFillColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onClearCanvas: () => void;
  onDeleteSelected: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  canvasState,
  onToolChange,
  onStrokeColorChange,
  onFillColorChange,
  onStrokeWidthChange,
  onClearCanvas,
  onDeleteSelected,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10 bg-white shadow-lg rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
      {/* Tool Selection */}
      <div className="flex items-center gap-2">
        {(
          [
            "selection",
            "rectangle",
            "circle",
            "line",
            "freehand",
            "text",
          ] as Tool[]
        ).map((tool) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            title={tool.charAt(0).toUpperCase() + tool.slice(1)}
            className={`w-10 h-10 flex items-center justify-center text-lg font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
              canvasState.currentTool === tool
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {/* Tool Icons */}
            {tool === "selection" && "↖"}
            {tool === "rectangle" && "□"}
            {tool === "circle" && "○"}
            {tool === "line" && "/"}
            {tool === "freehand" && "✏"}
            {tool === "text" && "T"}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-gray-300" />

      {/* Color Controls */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-500 font-medium">Stroke</div>
          <input
            type="color"
            value={canvasState.strokeColor}
            onChange={(e) => onStrokeColorChange(e.target.value)}
            className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer"
            title="Stroke Color"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-500 font-medium">Fill</div>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={
                canvasState.fillColor === "transparent"
                  ? "#ffffff"
                  : canvasState.fillColor
              }
              onChange={(e) => onFillColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer"
              title="Fill Color"
            />
            <button
              onClick={() => onFillColorChange("transparent")}
              className={`w-6 h-8 text-xs rounded-md transition-colors ${
                canvasState.fillColor === "transparent"
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="No Fill"
            >
              ∅
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-gray-300" />

      {/* Stroke Width */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs text-gray-500 font-medium">Width</div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="20"
            value={canvasState.strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
            className="w-20"
            title={`Stroke Width: ${canvasState.strokeWidth}px`}
          />
          <div className="text-xs text-gray-600 font-mono w-6 text-center">
            {canvasState.strokeWidth}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-gray-300" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onClearCanvas}
          className="w-10 h-10 flex items-center justify-center text-lg font-medium text-red-700 bg-red-50 rounded-xl hover:bg-red-100 border border-red-200 transition-colors"
          title="Clear Canvas"
        >
          🗑
        </button>

        {canvasState.selectedElementId && (
          <button
            onClick={onDeleteSelected}
            className="w-10 h-10 flex items-center justify-center text-lg font-medium text-red-700 bg-red-50 rounded-xl hover:bg-red-100 border border-red-200 transition-colors"
            title="Delete Selected"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
