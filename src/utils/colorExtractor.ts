// Utility to extract the dominant light color from an image (excluding white/near-white)
export const extractLightestColor = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('#f3f4f6'); // Default light gray
        return;
      }
      
      // Set canvas size to a smaller version for performance
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      
      // Draw the image scaled down
      ctx.drawImage(img, 0, 0, size, size);
      
      try {
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        const colorCounts: { [key: string]: { count: number; brightness: number } } = {};
        
        // Sample every 4th pixel for performance
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent pixels
          if (a < 128) continue;
          
          // Calculate brightness (0-255)
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
          
          // Only consider reasonably bright colors, but not pure white
          if (brightness < 100 || brightness > 250) continue;
          
          // Skip colors that are too close to white/gray
          const isNearWhite = r > 230 && g > 230 && b > 230;
          const isNearGray = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15 && brightness > 200;
          
          if (isNearWhite || isNearGray) continue;
          
          // Round colors to reduce noise
          const roundedR = Math.round(r / 12) * 12;
          const roundedG = Math.round(g / 12) * 12;
          const roundedB = Math.round(b / 12) * 12;
          
          const colorKey = `${roundedR},${roundedG},${roundedB}`;
          
          if (!colorCounts[colorKey]) {
            colorCounts[colorKey] = { count: 0, brightness: brightness };
          }
          colorCounts[colorKey].count += 1;
        }
        
        if (Object.keys(colorCounts).length === 0) {
          resolve('#e5e7eb'); // Default light gray
          return;
        }
        
        // Find the lightest color among the most common colors - prioritize brightness heavily
        let bestColor = '';
        let bestBrightness = 0;
        let minCountThreshold = 3; // Minimum count to be considered
        
        // First pass: find colors with decent frequency
        const validColors = Object.entries(colorCounts).filter(([_, data]) => data.count >= minCountThreshold);
        
        if (validColors.length === 0) {
          // If no colors meet threshold, use all colors
          for (const [color, data] of Object.entries(colorCounts)) {
            if (data.brightness > bestBrightness) {
              bestBrightness = data.brightness;
              bestColor = color;
            }
          }
        } else {
          // Among valid colors, pick the brightest
          for (const [color, data] of validColors) {
            if (data.brightness > bestBrightness) {
              bestBrightness = data.brightness;
              bestColor = color;
            }
          }
        }
        
        if (bestColor) {
          const [r, g, b] = bestColor.split(',').map(Number);
          // Make the color lighter for high contrast background
          const lighterR = Math.min(255, r + 50);
          const lighterG = Math.min(255, g + 50);
          const lighterB = Math.min(255, b + 50);
          
          resolve(`rgb(${lighterR}, ${lighterG}, ${lighterB})`);
        } else {
          resolve('#e5e7eb'); // Default light gray
        }
        
      } catch (error) {
        console.warn('Error extracting color:', error);
        resolve('#e5e7eb'); // Default light gray
      }
    };
    
    img.onerror = () => {
      resolve('#e5e7eb'); // Default light gray
    };
    
    img.src = imageSrc;
  });
};

// Fallback colors for each song if image extraction fails (optimized for high contrast)
export const fallbackColors = {
  1: '#e7e0ac', // Love Story - better golden color as specified
  2: '#fca5a5', // All Too Well - coral red
  3: '#c4b5fd', // The Last Great American Dynasty - lavender purple
  4: '#93c5fd', // Bigger Than The Whole Sky - sky blue
};