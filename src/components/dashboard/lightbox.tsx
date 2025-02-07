"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Play,
  Pause,
  Download,
  Share2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LightBoxImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  description?: string;
}

interface LightBoxProps {
  images: LightBoxImage[];
  initialIndex?: number;
  onClose?: () => void;
  showThumbnails?: boolean;
  enableZoom?: boolean;
  enableSwipe?: boolean;
  backgroundColor?: string;
  closeOnClickOutside?: boolean;
  autoPlayInterval?: number;
  enableFullscreen?: boolean;
  enableDownload?: boolean;
  enableSharing?: boolean;
  keyboardShortcuts?: {
    prev?: string;
    next?: string;
    close?: string;
    fullscreen?: string;
    play?: string;
    info?: string;
    rotateLeft?: string;
    rotateRight?: string;
    flipHorizontal?: string;
    flipVertical?: string;
  };
  transitionEffects?: {
    type?: "fade" | "slide" | "zoom";
    duration?: number;
    easing?: string;
  };
  swipeThreshold?: number;
  showLoadingIndicator?: boolean;
  customButtons?: React.ReactNode[];
  overlayContent?: (currentImage: LightBoxImage) => React.ReactNode;
  onError?: (error: Error, image: LightBoxImage) => void;
}

export function LightBox({
  images,
  initialIndex = 0,
  onClose,
  showThumbnails = true,
  enableZoom = true,
  enableSwipe = true,
  backgroundColor = "rgba(0, 0, 0, 0.9)",
  closeOnClickOutside = true,
  autoPlayInterval = 0,
  enableFullscreen = true,
  enableDownload = true,
  enableSharing = true,
  keyboardShortcuts,
  swipeThreshold,
  showLoadingIndicator = false,
  customButtons,
  overlayContent,
  onError,
}: LightBoxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeLightBox = useCallback(() => {
    setIsOpen(false);
    setScale(1);
    setIsPlaying(false);
    if (onClose) onClose();
  }, [onClose]);

  const nextImage = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setScale(1);
    setIsLoading(true);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
    setScale(1);
    setIsLoading(true);
  }, [images.length]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen((prev) => !prev);
  }, [isFullscreen]);

  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcuts = {
        prev: keyboardShortcuts?.prev || "ArrowLeft",
        next: keyboardShortcuts?.next || "ArrowRight",
        close: keyboardShortcuts?.close || "Escape",
        fullscreen: keyboardShortcuts?.fullscreen || "f",
        play: keyboardShortcuts?.play || " ",
        info: keyboardShortcuts?.info || "i",
        rotateLeft: keyboardShortcuts?.rotateLeft || "[",
        rotateRight: keyboardShortcuts?.rotateRight || "]",
        flipHorizontal: keyboardShortcuts?.flipHorizontal || "{",
        flipVertical: keyboardShortcuts?.flipVertical || "}",
      };

      if (e.key === shortcuts.close) closeLightBox();
      if (e.key === shortcuts.prev) prevImage();
      if (e.key === shortcuts.next) nextImage();
      if (e.key === shortcuts.fullscreen) toggleFullscreen();
      if (e.key === shortcuts.play) togglePlay();
      if (e.key === shortcuts.info) setShowInfo((prev) => !prev);
      if (e.key === shortcuts.rotateLeft) handleRotate(-90);
      if (e.key === shortcuts.rotateRight) handleRotate(90);
      if (e.key === shortcuts.flipHorizontal) handleFlipHorizontal();
      if (e.key === shortcuts.flipVertical) handleFlipVertical();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    keyboardShortcuts,
    closeLightBox,
    prevImage,
    nextImage,
    toggleFullscreen,
    togglePlay,
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && autoPlayInterval > 0) {
      interval = setInterval(nextImage, autoPlayInterval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, autoPlayInterval, currentIndex, nextImage]);

  const handleZoomIn = () =>
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
  const handleZoomOut = () =>
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));

  const handleSwipe = useCallback(
    (event: MouseEvent | TouchEvent, info: PanInfo) => {
      const threshold = swipeThreshold || 100;
      if (info.offset.x > threshold) prevImage();
      else if (info.offset.x < -threshold) nextImage();
    },
    [swipeThreshold, nextImage, prevImage]
  );

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleFlipHorizontal = () => {
    setFlipHorizontal((prev) => !prev);
  };

  const handleFlipVertical = () => {
    setFlipVertical((prev) => !prev);
  };

  useEffect(() => {
    // Preload next and previous images
    const preloadImage = (src: string) => {
      const img = document.createElement("img");
      img.src = src;
      return img;
    };

    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    const nextIndex = (currentIndex + 1) % images.length;

    preloadImage(images[prevIndex].src);
    preloadImage(images[nextIndex].src);
  }, [currentIndex, images]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = images[currentIndex].src;
    link.download = `image-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: images[currentIndex].alt,
        text: images[currentIndex].description,
        url: images[currentIndex].src,
      });
    } else {
      alert("Sharing is not supported on this device");
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <Image
            key={index}
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            onClick={() => {
              setCurrentIndex(index);
              setIsOpen(true);
              setIsLoading(true);
            }}
            className="cursor-pointer transition-transform hover:scale-105"
          />
        ))}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor }}
            onClick={closeOnClickOutside ? closeLightBox : undefined}
          >
            <motion.div
              className="relative max-h-[90vh] max-w-[90vw]"
              drag={enableSwipe ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleSwipe}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <Image
                  src={images[currentIndex].src}
                  alt={images[currentIndex].alt}
                  width={images[currentIndex].width}
                  height={images[currentIndex].height}
                  className={cn(
                    "max-h-[80vh] max-w-[80vw] object-contain",
                    "transition-all duration-300 ease-in-out"
                  )}
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg) scaleX(${
                      flipHorizontal ? -1 : 1
                    }) scaleY(${flipVertical ? -1 : 1})`,
                  }}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    if (onError)
                      onError(
                        new Error("Image load error"),
                        images[currentIndex]
                      );
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                {showLoadingIndicator && isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="animate-spin rounded-full border-4 border-t-transparent border-white h-10 w-10" />
                  </div>
                )}
              </motion.div>
              {overlayContent && (
                <div className="absolute inset-0 pointer-events-none">
                  {overlayContent(images[currentIndex])}
                </div>
              )}
              <div className="absolute top-4 right-4 flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeLightBox();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Close (Esc)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {images.length > 1 && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2"
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Previous (←)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Next (→)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
                {enableZoom && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleZoomIn();
                            }}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Zoom In</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleZoomOut();
                            }}
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Zoom Out</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
                {enableFullscreen && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFullscreen();
                          }}
                        >
                          {isFullscreen ? (
                            <Minimize className="h-4 w-4" />
                          ) : (
                            <Maximize className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Toggle Fullscreen (F)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {autoPlayInterval > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay();
                          }}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Toggle Autoplay (Space)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {enableDownload && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download Image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {enableSharing && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare();
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share Image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowInfo((prev) => !prev);
                        }}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle Image Info (I)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {customButtons && customButtons.length > 0 && (
                  <div className="flex space-x-2">
                    {customButtons.map((btn, idx) => (
                      <div key={idx}>{btn}</div>
                    ))}
                  </div>
                )}
              </div>
              {showInfo && images[currentIndex].description && (
                <div className="absolute bottom-16 left-0 right-0 bg-black bg-opacity-50 p-4 text-white">
                  <p>{images[currentIndex].description}</p>
                </div>
              )}
            </motion.div>
            {showThumbnails && (
              <div className="absolute bottom-4 left-4 right-4 flex justify-center overflow-x-auto">
                {images.map((image, index) => (
                  <Image
                    key={index}
                    src={image.src}
                    alt={image.alt}
                    width={60}
                    height={60}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                      setIsLoading(true);
                    }}
                    className={cn(
                      "m-1 cursor-pointer object-cover",
                      "transition-all duration-300 ease-in-out",
                      index === currentIndex
                        ? "border-2 border-white"
                        : "opacity-50 hover:opacity-100"
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
