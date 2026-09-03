"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { HiOutlinePhoto, HiOutlineXMark, HiOutlineCheck, HiOutlineArrowPath } from "react-icons/hi2";
import { toast } from "sonner";
import { supabase } from "@awssbg/shared";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
  aspectRatio?: "1:1" | "16:9";
  category?: "team" | "blog" | "hero" | "general";
  orgId?: string;
  title?: string;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  onSuccess,
  aspectRatio = "1:1",
  category = "team",
  orgId = "tut",
  title = "Upload & Crop Image",
}: ImageUploadModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Pan and zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setImageSrc(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsDecoding(false);
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size cap (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File exceeds 20MB limit. Please choose a smaller photo.");
      return;
    }

    const isHeic =
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif") ||
      file.type === "image/heic" ||
      file.type === "image/heif";

    if (isHeic) {
      setIsDecoding(true);
      const loadingToast = toast.loading("Converting Apple HEIC photo...");
      try {
        const heic2any = (await import("heic2any")).default;
        const convertedBlob = (await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        })) as Blob;

        const objectUrl = URL.createObjectURL(Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob);
        setImageSrc(objectUrl);
        toast.dismiss(loadingToast);
        toast.success("HEIC converted successfully!");
      } catch (err) {
        console.error("HEIC decode failure:", err);
        toast.dismiss(loadingToast);
        toast.error("Failed to decode HEIC image. Please upload a JPEG, PNG, or WebP.");
      } finally {
        setIsDecoding(false);
      }
    } else {
      const objectUrl = URL.createObjectURL(file);
      setImageSrc(objectUrl);
    }
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    },
    [isDragging]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Process crop & compress to WebP on client canvas
  const handleCropAndUpload = async () => {
    if (!imageRef.current) return;

    setIsUploading(true);
    const uploadToast = toast.loading("Compressing and uploading image...");

    try {
      const img = imageRef.current;
      const targetWidth = aspectRatio === "16:9" ? 1280 : 800;
      const targetHeight = aspectRatio === "16:9" ? 720 : 800;

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not initialize canvas rendering context.");

      // Calculate source crop geometry based on zoom and pan
      const frameAspect = targetWidth / targetHeight;
      const imgAspect = img.naturalWidth / img.naturalHeight;

      let drawWidth = targetWidth * zoom;
      let drawHeight = targetHeight * zoom;

      if (imgAspect > frameAspect) {
        drawWidth = drawHeight * imgAspect;
      } else {
        drawHeight = drawWidth / imgAspect;
      }

      const drawX = (targetWidth - drawWidth) / 2 + pan.x * (targetWidth / 300);
      const drawY = (targetHeight - drawHeight) / 2 + pan.y * (targetHeight / 300);

      // Fill canvas background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Render image with pan and zoom applied
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Export as WebP (target 300–500KB)
      const webpBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/webp", 0.85)
      );

      if (!webpBlob) throw new Error("Canvas WebP compression failed.");

      // Get authenticated session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append("file", webpBlob, "photo.webp");
      formData.append("category", category);
      formData.append("org_id", orgId);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: formData,
      });

      const json = (await res.json()) as { success?: boolean; url?: string; error?: string };

      if (!res.ok || !json.url) {
        throw new Error(json.error || "Upload rejected by edge server.");
      }

      toast.dismiss(uploadToast);
      toast.success("Image uploaded successfully!");
      onSuccess(json.url);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      toast.dismiss(uploadToast);
      toast.error("Upload failed: " + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-lg border-[3px] border-black bg-white shadow-[8px_8px_0px_#000000] rounded-none animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-black bg-black px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <HiOutlinePhoto className="h-5 w-5 text-purple-400" />
            <h3 className="font-mono text-xs font-black uppercase tracking-wider">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-400 active:translate-x-[1px] active:translate-y-[1px]"
            aria-label="Close modal"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!imageSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-[3px] border-dashed border-black bg-zinc-50 p-8 text-center cursor-pointer hover:bg-purple-50 transition-colors"
            >
              <HiOutlinePhoto className="h-12 w-12 text-zinc-400 mb-3" />
              <p className="font-mono text-xs font-black uppercase text-black mb-1">
                Click or tap to choose photo
              </p>
              <p className="font-mono text-[10px] text-zinc-500">
                Accepts iPhone HEIC, JPEG, PNG, WebP (Max 20MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Crop Frame */}
              <div className="flex flex-col items-center">
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    aspectRatio: aspectRatio === "16:9" ? "16/9" : "1/1",
                  }}
                  className="relative w-full max-w-[340px] overflow-hidden border-[3px] border-black bg-zinc-900 cursor-grab active:cursor-grabbing select-none"
                >
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Upload preview"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: "center center",
                    }}
                    className="h-full w-full object-cover pointer-events-none transition-transform duration-75"
                  />
                  <div className="absolute top-2 right-2 border-2 border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white">
                    {aspectRatio} CROP
                  </div>
                </div>
                <p className="mt-2 font-mono text-[10px] text-zinc-500 uppercase">
                  Drag to pan &bull; Use slider below to zoom
                </p>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-3 border-2 border-black bg-zinc-50 p-2">
                <span className="font-mono text-[10px] font-black uppercase">Zoom:</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <button
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="border border-black bg-white px-2 py-1 font-mono text-[9px] font-black uppercase hover:bg-zinc-100"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-[3px] border-black bg-zinc-100 px-6 py-3">
          <button
            onClick={() => {
              if (imageSrc) {
                setImageSrc(null);
              } else {
                onClose();
              }
            }}
            disabled={isUploading}
            className="border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-zinc-50"
          >
            {imageSrc ? "Choose Other" : "Cancel"}
          </button>

          {imageSrc && (
            <button
              onClick={handleCropAndUpload}
              disabled={isUploading || isDecoding}
              className="flex items-center gap-1.5 border-2 border-black bg-purple-600 px-5 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-purple-700 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <HiOutlineCheck className="h-4 w-4" />
                  <span>Crop &amp; Upload</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
