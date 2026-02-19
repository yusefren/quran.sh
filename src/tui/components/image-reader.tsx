import { PNG } from "pngjs";
import { FrameBufferRenderable, RGBA, BoxRenderable } from "@opentui/core";
import type { RenderContext } from "@opentui/core";
import { useEffect, useRef, useState } from "react";
import { useRenderer } from "@opentui/react";
import { getSurah } from "../../data/quran";

interface ImageReaderProps {
  surahId: number;
  verseId: number;
  focused?: boolean;
}

export function ImageReader({ surahId, verseId, focused = false }: ImageReaderProps) {
  const boxRef = useRef<any>(null);
  const renderer = useRenderer();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    let canvas: FrameBufferRenderable | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined = undefined;

    async function loadAndRender() {
      setLoading(true);
      setError(null);
      
      try {
        // e.g. https://surahquran.com/img/ayah/35-25.png
        const url = `https://surahquran.com/img/ayah/${surahId}-${verseId}.png`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch image: ${res.statusText}`);
        }
        
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        if (!active) return;

        const png = PNG.sync.read(buffer);
        
        if (!boxRef.current) return;
        
        // We'll calculate the available width/height on the next layout pass, 
        // but for now we expect the container to flex.
        const boxWidth = boxRef.current.getLayoutNode().getComputedWidth() || 80;
        const boxHeight = boxRef.current.getLayoutNode().getComputedHeight() || 40;

        // Auto-Crop the image to maximize limited terminal space
        let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
        for (let y = 0; y < png.height; y++) {
          for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            const a = (png.data[idx+3] ?? 255) / 255;
            const r = (png.data[idx] ?? 255) / 255;
            const g = (png.data[idx+1] ?? 255) / 255;
            const b = (png.data[idx+2] ?? 255) / 255;
            
            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const finalLuma = luma * a + 1.0 * (1 - a);
            
            // Tightly crop anything that isn't almost pure white/transparent
            if (finalLuma < 0.95) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        
        // Handle empty or pure white image safely
        if (minX > maxX) {
          minX = 0; maxX = png.width - 1;
          minY = 0; maxY = png.height - 1;
        }
        
        // Add a tiny bit of breathing room
        minX = Math.max(0, minX - 4);
        maxX = Math.min(png.width - 1, maxX + 4);
        minY = Math.max(0, minY - 4);
        maxY = Math.min(png.height - 1, maxY + 4);

        const croppedWidth = maxX - minX + 1;
        const croppedHeight = maxY - minY + 1;

        const ratio = croppedHeight / croppedWidth;
        const w = boxWidth > 10 ? boxWidth - 4 : 80;
        // Standard terminal aspect ratio is ~0.45 (width/height). 
        // Braille packs 2x4 dots, so the virtual dots are basically squares.
        const h = Math.max(Math.ceil(w * ratio * 0.45), 5);

        canvas = new FrameBufferRenderable(renderer, {
          id: `canvas-${surahId}-${verseId}`,
          width: w,
          height: h,
          alignItems: "center",
          justifyContent: "center",
        });
        
        const vW = w * 2;
        const vH = h * 4;
        const scaleX = croppedWidth / vW;
        const scaleY = croppedHeight / vH;
        
        const isDark = (vx: number, vy: number): boolean => {
          const localStartX = Math.floor(vx * scaleX);
          const localStartY = Math.floor(vy * scaleY);
          const localEndX = Math.max(localStartX + 1, Math.floor((vx + 1) * scaleX));
          const localEndY = Math.max(localStartY + 1, Math.floor((vy + 1) * scaleY));
          
          const startX = minX + localStartX;
          const startY = minY + localStartY;
          const endX = minX + localEndX;
          const endY = minY + localEndY;
          
          let minLuma = 1.0;
          
          for (let py = startY; py < endY && py <= maxY && py < png.height; py++) {
            for (let px = startX; px < endX && px <= maxX && px < png.width; px++) {
              const idx = (png.width * py + px) << 2;
              const a = (png.data[idx+3] ?? 255) / 255;
              const r = (png.data[idx] ?? 255) / 255;
              const g = (png.data[idx+1] ?? 255) / 255;
              const b = (png.data[idx+2] ?? 255) / 255;
              
              const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              // Blend with white background where it's transparent.
              const finalLuma = luma * a + 1.0 * (1 - a);
              if (finalLuma < minLuma) {
                minLuma = finalLuma;
              }
            }
          }
          // Using minimum luma ensures that incredibly thin vector strokes
          // are preserved during downscaling instead of being averaged out!
          return minLuma < 0.85; 
        };
        
        const bgColor = RGBA.fromValues(0, 0, 0, 0); 
        // We'll use a soft white for the calligraphy itself.
        const fgColor = RGBA.fromValues(0.9, 0.9, 0.9, 1);
        canvas.frameBuffer.fillRect(0, 0, w, h, bgColor);

        // Braille unicode map based on dy * 2 + dx index
        const brailleMap = [0x1, 0x8, 0x2, 0x10, 0x4, 0x20, 0x40, 0x80];

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let charCode = 0x2800; // Base braille character (empty)
            for (let dy = 0; dy < 4; dy++) {
              for (let dx = 0; dx < 2; dx++) {
                if (isDark(x * 2 + dx, y * 4 + dy)) {
                  charCode += brailleMap[dy * 2 + dx]!;
                }
              }
            }
            const char = String.fromCharCode(charCode);
            canvas.frameBuffer.setCellWithAlphaBlending(x, y, char, fgColor, bgColor);
          }
        }

        if (active && boxRef.current) {
          boxRef.current.add(canvas);
          setLoading(false);
        }

      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to load image");
          setLoading(false);
        }
      }
    }

    loadAndRender();

    return () => {
      active = false;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (canvas && boxRef.current) {
        boxRef.current.remove(canvas.id);
      }
    };
  }, [surahId, verseId, renderer]);

  return (
    <scrollbox 
      ref={boxRef} 
      width="100%" 
      height="100%" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      scrollY={true}
      focusable={true}
      focused={focused}
      scrollbarOptions={{ visible: false }}
      viewportCulling={true}
    >
      {loading && (
        <text fg="#888888">Loading image for {getSurah(surahId)?.transliteration} {surahId}:{verseId}...</text>
      )}
      {error && (
        <text fg="#ff5555">{error}</text>
      )}
    </scrollbox>
  );
}
