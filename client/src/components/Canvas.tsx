import React, { useRef, useEffect, useState, useCallback } from "react";
import type { Tool, CanvasState, DrawingState, Point } from "../types/canvas";
import { createElement, drawElement, getElementAtPosition } from "../utils";
import Toolbar from "./Toolbar";

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    elements: [],
    selectedElementId: null,
    currentTool: "rectangle",
    strokeColor: "#000000",
    fillColor: "transparent",
    strokeWidth: 2,
  });

  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentElement: null,
    startPoint: null,
  });

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Clear canvas with transparent background so dotted pattern shows through
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all elements
    canvasState.elements.forEach((element) => {
      drawElement(ctx, element, element.id === canvasState.selectedElementId);
    });

    // Draw current element being drawn
    if (drawingState.currentElement) {
      drawElement(ctx, drawingState.currentElement);
    }
  }, [
    canvasState.elements,
    canvasState.selectedElementId,
    drawingState.currentElement,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [redrawCanvas]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getMousePos(e);

    if (canvasState.currentTool === "selection") {
      const element = getElementAtPosition(
        point.x,
        point.y,
        canvasState.elements
      );
      setCanvasState((prev) => ({
        ...prev,
        selectedElementId: element?.id || null,
      }));
      return;
    }

    setDrawingState({
      isDrawing: true,
      startPoint: point,
      currentElement:
        canvasState.currentTool === "freehand"
          ? createElement(
              canvasState.currentTool,
              point.x,
              point.y,
              0,
              0,
              canvasState.strokeColor,
              canvasState.fillColor,
              canvasState.strokeWidth
            )
          : null,
    });

    if (canvasState.currentTool === "freehand") {
      setDrawingState((prev) => ({
        ...prev,
        currentElement: prev.currentElement
          ? {
              ...prev.currentElement,
              points: [point],
            }
          : null,
      }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing || !drawingState.startPoint) return;

    const point = getMousePos(e);

    if (canvasState.currentTool === "freehand" && drawingState.currentElement) {
      setDrawingState((prev) => ({
        ...prev,
        currentElement: prev.currentElement
          ? {
              ...prev.currentElement,
              points: [...(prev.currentElement.points || []), point],
            }
          : null,
      }));
      return;
    }

    // For other tools, create/update the current element
    const width = point.x - drawingState.startPoint.x;
    const height = point.y - drawingState.startPoint.y;

    const newElement = createElement(
      canvasState.currentTool as Exclude<Tool, "selection">,
      drawingState.startPoint.x,
      drawingState.startPoint.y,
      width,
      height,
      canvasState.strokeColor,
      canvasState.fillColor,
      canvasState.strokeWidth
    );

    setDrawingState((prev) => ({ ...prev, currentElement: newElement }));
  };

  const handleMouseUp = () => {
    if (!drawingState.isDrawing || !drawingState.currentElement) return;

    // Add the completed element to the canvas
    setCanvasState((prev) => ({
      ...prev,
      elements: [...prev.elements, drawingState.currentElement!],
    }));

    // Reset drawing state
    setDrawingState({
      isDrawing: false,
      currentElement: null,
      startPoint: null,
    });
  };

  const clearCanvas = () => {
    setCanvasState((prev) => ({
      ...prev,
      elements: [],
      selectedElementId: null,
    }));
  };

  const deleteSelected = () => {
    if (!canvasState.selectedElementId) return;

    setCanvasState((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== prev.selectedElementId),
      selectedElementId: null,
    }));
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      }
      if (e.key === "Escape") {
        setCanvasState((prev) => ({ ...prev, selectedElementId: null }));
      }
    },
    [canvasState.selectedElementId]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative h-screen bg-gray-100">
      {/* Floating Toolbar */}
      <Toolbar
        canvasState={canvasState}
        onToolChange={(tool) =>
          setCanvasState((prev) => ({ ...prev, currentTool: tool }))
        }
        onStrokeColorChange={(color) =>
          setCanvasState((prev) => ({ ...prev, strokeColor: color }))
        }
        onFillColorChange={(color) =>
          setCanvasState((prev) => ({ ...prev, fillColor: color }))
        }
        onStrokeWidthChange={(width) =>
          setCanvasState((prev) => ({ ...prev, strokeWidth: width }))
        }
        onClearCanvas={clearCanvas}
        onDeleteSelected={deleteSelected}
      />

      {/* Canvas Area with Dotted Background */}
      <div className="relative h-full w-full bg-[#f8fafc]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(#0000001a_1px,#f8fafc_1px)] bg-[size:16px_16px]"></div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Floating Status Bar */}
      <div className="fixed top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <div className="font-medium text-gray-800">
            {canvasState.currentTool.charAt(0).toUpperCase() +
              canvasState.currentTool.slice(1)}
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <div>Elements: {canvasState.elements.length}</div>
          {canvasState.selectedElementId && (
            <>
              <div className="w-px h-4 bg-gray-300" />
              <div className="text-blue-600">Selected: 1</div>
            </>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          Delete/Backspace: Remove • Escape: Deselect
        </div>
      </div>
    </div>
  );
};

export default Canvas;
