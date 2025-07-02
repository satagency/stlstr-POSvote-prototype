import { ChevronRightIcon, XIcon } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Separator } from "../../components/ui/separator";
import { extractLightestColor, fallbackColors } from "../../utils/colorExtractor";

// Song data for the carousel
const songData = [
  {
    id: 1,
    title: "Love Story",
    price: 3,
    rarity: "COMMON",
    rarityImage: "/rarity-common.svg",
    image: "/lovestory.jpg",
  },
  {
    id: 2,
    title: "All Too Well (10 Minute Version)",
    price: 5,
    rarity: "EPIC",
    rarityImage: "/rarity-epic.svg",
    image: "/All Too Well (10 Minute Version).jpeg",
  },
  {
    id: 3,
    title: "The Last Great American Dynasty",
    price: 10,
    rarity: "LEGENDARY",
    rarityImage: "/rarity-legendary.svg",
    image: "/The Last Great American Dynasty.jpeg",
  },
  {
    id: 4,
    title: "Bigger Than The Whole Sky",
    price: 20,
    rarity: "RARE",
    rarityImage: "/rarity-rare.svg",
    image: "/biggerthan.jpg",
  },
];

// Utility function to determine if a color is light or dark
const isLightColor = (color: string): boolean => {
  // Convert color to RGB values
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return true; // Default to light if can't parse
  
  const [r, g, b] = rgb.map(Number);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.6; // Threshold for determining light vs dark
};

export const Vote = (): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});
  const [modalCardColor, setModalCardColor] = useState('#ffffff');
  const [extractedColors, setExtractedColors] = useState<{[key: number]: string}>({});
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [nudgeOffset, setNudgeOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const nudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardWidth = 340; // Width of each card - FIXED TO 340px as per SeatGeek design system

  // Determine contrast colors based on background
  const isLightBackground = isLightColor(modalCardColor);
  const contrastColor = isLightBackground ? '#4a5568' : '#e2e8f0'; // Dark gray for light bg, light gray for dark bg
  const separatorColor = isLightBackground ? '#e2e8f0' : '#4a5568'; // Light gray for light bg, dark gray for dark bg

  const handleImageError = (songId: number) => {
    setImageErrors(prev => ({ ...prev, [songId]: true }));
  };

  // Auto-nudge animation function - now more subtle
  const startNudgeAnimation = () => {
    if (hasUserInteracted || isDragging) return;
    
    // Only nudge if there are more items to show
    const canNudgeLeft = currentIndex > 0;
    const canNudgeRight = currentIndex < songData.length - 1;
    
    if (!canNudgeLeft && !canNudgeRight) return;
    
    // Determine nudge direction - prefer right if possible, otherwise left
    const nudgeDirection = canNudgeRight ? -1 : 1;
    const nudgeAmount = 12; // Reduced from 25px to 12px for subtlety
    
    // Animate the nudge with smoother timing
    setNudgeOffset(nudgeDirection * nudgeAmount);
    
    // Return to original position after a longer, smoother delay
    setTimeout(() => {
      setNudgeOffset(0);
    }, 800); // Increased from 600ms to 800ms for smoother feel
  };

  // Set up auto-nudge timer with longer intervals
  useEffect(() => {
    if (hasUserInteracted) return;
    
    // Start nudging after 3 seconds (increased from 2), then every 6 seconds (increased from 4)
    const initialDelay = setTimeout(() => {
      startNudgeAnimation();
      
      // Set up recurring nudge with longer interval
      nudgeTimeoutRef.current = setInterval(() => {
        startNudgeAnimation();
      }, 6000); // Increased from 4000ms to 6000ms
    }, 3000); // Increased from 2000ms to 3000ms
    
    return () => {
      clearTimeout(initialDelay);
      if (nudgeTimeoutRef.current) {
        clearInterval(nudgeTimeoutRef.current);
      }
    };
  }, [hasUserInteracted, currentIndex, isDragging]);

  // Clean up nudge timer when user interacts
  const handleUserInteraction = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      setNudgeOffset(0); // Reset any active nudge
      if (nudgeTimeoutRef.current) {
        clearInterval(nudgeTimeoutRef.current);
      }
    }
  };

  // Extract colors from all images on component mount
  useEffect(() => {
    const extractColors = async () => {
      const colors: {[key: number]: string} = {};
      
      for (const song of songData) {
        // For Love Story, always use the specific color you want
        if (song.id === 1) {
          colors[song.id] = '#e7e0ac';
          continue;
        }
        
        try {
          const color = await extractLightestColor(song.image);
          colors[song.id] = color;
        } catch (error) {
          console.warn(`Failed to extract color for ${song.title}:`, error);
          colors[song.id] = fallbackColors[song.id as keyof typeof fallbackColors] || '#ffffff';
        }
      }
      
      setExtractedColors(colors);
    };
    
    extractColors();
  }, []);

  // Update modal card color when current song changes
  useEffect(() => {
    const currentSong = songData[currentIndex];
    if (currentSong && extractedColors[currentSong.id]) {
      setModalCardColor(extractedColors[currentSong.id]);
    } else if (currentSong) {
      // Use fallback color if extraction hasn't completed yet
      const fallbackColor = fallbackColors[currentSong.id as keyof typeof fallbackColors] || '#ffffff';
      setModalCardColor(fallbackColor);
    }
  }, [currentIndex, extractedColors]);

  const handleMouseDown = (e: React.MouseEvent) => {
    handleUserInteraction();
    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleUserInteraction();
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const diff = currentX - startX;
    
    // Add elastic resistance at boundaries
    let elasticDiff = diff;
    if (currentIndex === 0 && diff > 0) {
      elasticDiff = diff * 0.3; // Elastic resistance when trying to go before first item
    } else if (currentIndex === songData.length - 1 && diff < 0) {
      elasticDiff = diff * 0.3; // Elastic resistance when trying to go after last item
    }
    
    setDragOffset(elasticDiff);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // Add elastic resistance at boundaries
    let elasticDiff = diff;
    if (currentIndex === 0 && diff > 0) {
      elasticDiff = diff * 0.3;
    } else if (currentIndex === songData.length - 1 && diff < 0) {
      elasticDiff = diff * 0.3;
    }
    
    setDragOffset(elasticDiff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const threshold = cardWidth * 0.3; // 30% of card width to trigger snap
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (dragOffset < 0 && currentIndex < songData.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
    
    setDragOffset(0);
  };

  // Calculate transform with perfect centering
  useEffect(() => {
    // Center the current card by calculating the offset needed
    const baseTransform = -currentIndex * cardWidth;
    setTranslateX(baseTransform);
  }, [currentIndex]);

  return (
    <div 
      className="flex flex-col min-h-screen items-center justify-center gap-7 px-4 sm:px-[60px] py-6 sm:py-[89px] relative"
      style={{
        background: 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%), #1a1a1a'
      }}
    >
      <Dialog open={true}>
        <DialogContent className="p-0 border-none bg-transparent flex items-center justify-center w-[340px] h-[610px] max-w-[340px] max-h-[610px]" hideCloseButton>
          <Card 
            className="flex flex-col w-[340px] h-[610px] max-w-[340px] max-h-[610px] items-center gap-2 pt-0 pb-3 px-0 relative rounded-xl border border-solid border-[#00000047] shadow-[0px_1px_12.9px_6px_#0000001a] transition-colors duration-700 ease-in-out overflow-hidden"
            style={{ backgroundColor: modalCardColor }}
          >
            <DialogHeader className="flex flex-col w-full h-[50px] items-start justify-center gap-2 pl-[21px] pr-[18.47px] py-2 relative border-b-[1.15px] [border-bottom-style:solid] border-[#c4c4c4] flex-shrink-0">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <DialogTitle asChild>
                  <h3 className="relative w-fit [font-family:'Roobert_PRO-Bold',Helvetica] font-bold text-black text-sm tracking-[0] leading-[20px] whitespace-nowrap">
                    Change the Setlist
                  </h3>
                </DialogTitle>

                {/* Hide X icon on mobile (screens smaller than 640px) */}
                <div className="hidden sm:inline-flex items-center gap-2 p-[3.46px] relative flex-[0_0_auto] bg-[#0000001a] rounded-[103.91px]">
                  <XIcon className="relative w-[18.47px] h-[18.47px]" />
                </div>
              </div>
            </DialogHeader>

            {/* Instruction text with compact spacing */}
            <div className="flex flex-col items-center px-6 py-3 relative self-stretch w-full flex-shrink-0">
              <p className="relative w-[308px] [font-family:'Roobert_PRO-Regular',Helvetica] font-normal text-[#000500] text-[16px] text-center tracking-[0] leading-[normal]">
                Cycle through the songs and select what you want to hear at your concert.
              </p>
            </div>

            {/* Carousel Container - adjusted for 340px modal */}
            <div className="relative w-[340px] h-[320px] overflow-hidden flex-shrink-0">
              <div
                ref={containerRef}
                className={`flex items-center ${isDragging ? '' : 'transition-transform duration-300 ease-out'} ${!hasUserInteracted && !isDragging ? 'transition-transform duration-700 ease-out' : ''}`}
                style={{
                  transform: `translateX(${translateX + dragOffset + nudgeOffset}px)`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleDragEnd}
              >
                {songData.map((song, index) => (
                  <div
                    key={song.id}
                    className="flex flex-col w-[340px] h-[320px] items-center justify-center gap-3 pt-3 pb-2 px-0 relative flex-shrink-0"
                    style={{ userSelect: 'none' }}
                  >
                    <div
                      className="relative w-[250px] h-[250px] rounded-[4.76px] overflow-hidden border-[1.19px] border-solid border-black shadow-[0px_4.76px_4.76px_#00000040,inset_0px_4.76px_3.56px_#ffffff80]"
                    >
                      {/* Background image with fallback */}
                      {!imageErrors[song.id] ? (
                        <img
                          src={song.image}
                          alt={song.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={() => handleImageError(song.id)}
                          style={{
                            filter: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)'
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-purple-400 to-purple-600 flex items-center justify-center">
                          <div className="text-white text-center p-4">
                            <div className="text-2xl mb-2">🎵</div>
                            <div className="text-sm font-medium">{song.title}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Dark overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

                      {/* White inner shadow at top only - consistent across all albums */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-[6px] pointer-events-none"
                        style={{
                          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 60%, transparent 100%)'
                        }}
                      />

                      {/* Price tag - Updated with #323232 background at 90% opacity */}
                      <div 
                        className="flex flex-col w-[50px] h-[40px] items-center justify-center gap-2 px-0.5 py-0 absolute left-0 top-0 rounded-[5px_0px_17.5px_0px] bg-blend-multiply"
                        style={{
                          backgroundColor: 'rgba(50, 50, 50, 0.9)' // #323232 with 90% opacity
                        }}
                      >
                        <div className="relative w-fit text-white text-center leading-[normal] flex items-baseline">
                          <span 
                            className="tracking-[0.5px]"
                            style={{ 
                              fontFamily: 'Arial, sans-serif',
                              fontWeight: '500', // Medium weight
                              fontSize: '16px', // Reduced from 19px
                              textShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)' // Black drop shadow 90% opacity
                            }}
                          >
                            $
                          </span>
                          <span 
                            className="tracking-[0]"
                            style={{ 
                              fontFamily: 'Arial Black, Arial, sans-serif', // Arial Black for the number
                              fontWeight: '900',
                              fontSize: '19px',
                              textShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)' // Black drop shadow 90% opacity
                            }}
                          >
                            {song.price}
                          </span>
                        </div>
                      </div>

                      {/* Rarity pills container - adjusted for smaller album art */}
                      <div className="absolute bottom-0 left-0 w-[250px] h-[65px] flex items-end justify-center pb-[15px] bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <img
                          className="relative flex-[0_0_auto] object-contain"
                          alt="Rarity pills"
                          src={song.rarityImage}
                          style={{
                            width: 'auto',
                            height: '22px', // Slightly smaller for mobile
                            maxWidth: '70px' // Prevent pills from getting too wide
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex w-[300px] items-center justify-center relative flex-[0_0_auto]">
                      <div className="relative w-fit max-w-[280px] [font-family:'Roobert_PRO-Bold',Helvetica] font-bold text-darkprimary text-lg tracking-[0] leading-[normal] text-center whitespace-nowrap overflow-hidden text-ellipsis">
                        {song.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicator Dots - Now contrast-aware with compact spacing */}
            <div className="flex w-[49.36px] h-[10.18px] items-center justify-between relative mb-4 flex-shrink-0">
              {songData.map((_, index) => (
                <div
                  key={index}
                  className="relative rounded-[91.59px] transition-all duration-700 ease-in-out"
                  style={{
                    width: index === currentIndex ? '10.18px' : '6.11px',
                    height: index === currentIndex ? '10.18px' : '6.11px',
                    backgroundColor: index === currentIndex 
                      ? contrastColor 
                      : `${contrastColor}80` // 50% opacity for inactive dots
                  }}
                />
              ))}
            </div>

            {/* Buy Now Button - Compact spacing */}
            <div className="w-[300px] h-10 mb-3 flex-shrink-0">
              <Button className="flex h-10 items-center justify-center gap-1 px-4 py-2 w-full bg-black rounded-[7.9px]">
                <div className="flex items-center justify-center gap-1">
                  <div className="[font-family:'Roobert_PRO-Medium',Helvetica] font-medium text-white text-lg text-center tracking-[0] leading-[normal] whitespace-nowrap">
                    Buy now
                  </div>

                  <div className="flex items-center">
                    <img
                      className="w-[50px] h-[20px]"
                      alt="Apple pay icon"
                      src="/apple-pay-icon.svg"
                    />
                  </div>
                </div>
              </Button>
            </div>

            {/* Separator - Now contrast-aware */}
            <Separator 
              className="w-[300px] h-px mb-3 transition-colors duration-700 ease-in-out flex-shrink-0" 
              style={{ backgroundColor: separatorColor }}
            />

            <div className="flex w-[300px] items-center gap-2.5 relative flex-[0_0_auto] flex-shrink-0">
              <img
                className="relative w-[58.6px] h-3"
                alt="Seatgeek logo inline"
                src="/seatgeek-logo-inline.svg"
              />

              <div className="relative w-56 mt-[-1.00px] [font-family:'Spotify_Mix_UI-Regular',Helvetica] font-normal text-[#333333] text-[8px] tracking-[0] leading-[9px]">
                By purchasing a ticket through SeatGeek or Setlister, you
                acknowledge that the setlist may change. We strive for accuracy but
                cannot guarantee specific songs will be performed.
              </div>
            </div>
          </Card>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        className="inline-flex items-center gap-2.5 p-1.5 absolute top-[405px] left-[343px] rounded-[90px]"
      >
        <ChevronRightIcon className="relative w-8 h-8" />
      </Button>
    </div>
  );
};