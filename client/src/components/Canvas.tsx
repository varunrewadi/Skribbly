import React, { useRef, useEffect, useState, useCallback } from "react";
import type {
  Tool,
  CanvasState,
  DrawingState,
  Point,
  ViewportState,
  PanState,
} from "../types/canvas";
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

  const [viewportState, setViewportState] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });

  const [panState, setPanState] = useState<PanState>({
    isPanning: false,
    lastPanPoint: null,
  });

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Clear canvas with transparent background so dotted pattern shows through
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply viewport transformations
    ctx.save();
    ctx.translate(viewportState.offsetX, viewportState.offsetY);
    ctx.scale(viewportState.scale, viewportState.scale);

    // Draw all elements
    canvasState.elements.forEach((element) => {
      drawElement(ctx, element, element.id === canvasState.selectedElementId);
    });

    // Draw current element being drawn
    if (drawingState.currentElement) {
      drawElement(ctx, drawingState.currentElement);
    }

    ctx.restore();
  }, [
    canvasState.elements,
    canvasState.selectedElementId,
    drawingState.currentElement,
    viewportState.offsetX,
    viewportState.offsetY,
    viewportState.scale,
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
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Convert canvas coordinates to world coordinates (accounting for pan and zoom)
    return {
      x: (canvasX - viewportState.offsetX) / viewportState.scale,
      y: (canvasY - viewportState.offsetY) / viewportState.scale,
    };
  };

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
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
    const canvasPoint = getCanvasPos(e);

    // Handle panning with pan tool, middle mouse button, or modifier keys + left click
    if (
      canvasState.currentTool === "pan" ||
      e.button === 1 ||
      (e.button === 0 && (e.metaKey || e.ctrlKey || e.shiftKey))
    ) {
      setPanState({
        isPanning: true,
        lastPanPoint: canvasPoint,
      });
      return;
    }

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
    const canvasPoint = getCanvasPos(e);

    // Handle panning
    if (panState.isPanning && panState.lastPanPoint) {
      const deltaX = canvasPoint.x - panState.lastPanPoint.x;
      const deltaY = canvasPoint.y - panState.lastPanPoint.y;

      setViewportState((prev) => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
      }));

      setPanState((prev) => ({
        ...prev,
        lastPanPoint: canvasPoint,
      }));
      return;
    }

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
    // Reset panning state
    if (panState.isPanning) {
      setPanState({
        isPanning: false,
        lastPanPoint: null,
      });
      return;
    }

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

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(
        0.1,
        Math.min(5, viewportState.scale * scaleFactor)
      );

      // Calculate new offset to zoom towards mouse position
      const mouseWorldX =
        (mouseX - viewportState.offsetX) / viewportState.scale;
      const mouseWorldY =
        (mouseY - viewportState.offsetY) / viewportState.scale;

      const newOffsetX = mouseX - mouseWorldX * newScale;
      const newOffsetY = mouseY - mouseWorldY * newScale;

      setViewportState({
        offsetX: newOffsetX,
        offsetY: newOffsetY,
        scale: newScale,
      });
    },
    [viewportState]
  );

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
      <div className="relative h-full w-full bg-[#f8fafc] overflow-hidden">
        <div
          className="absolute bg-[radial-gradient(#0000001a_1px,#f8fafc_1px)] bg-[size:16px_16px]"
          style={{
            left: `${viewportState.offsetX % (16 * viewportState.scale)}px`,
            top: `${viewportState.offsetY % (16 * viewportState.scale)}px`,
            width: `${100 + Math.ceil(16 * viewportState.scale)}%`,
            height: `${100 + Math.ceil(16 * viewportState.scale)}%`,
            backgroundSize: `${16 * viewportState.scale}px ${
              16 * viewportState.scale
            }px`,
          }}
        ></div>
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full ${
            panState.isPanning
              ? "cursor-grabbing"
              : canvasState.currentTool === "pan"
              ? "cursor-grab"
              : canvasState.currentTool === "selection"
              ? "cursor-default"
              : "cursor-crosshair"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
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
