import React from 'react';
import { Button } from './button';

interface BuyNowButtonProps {
  /** Width of the button container */
  width?: string;
  /** Height of the button */
  height?: string;
  /** Custom className for additional styling */
  className?: string;
  /** Button text - defaults to "Buy now" */
  text?: string;
  /** Whether to show Apple Pay icon */
  showApplePay?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

export const BuyNowButton: React.FC<BuyNowButtonProps> = ({
  width = "w-[300px]",
  height = "h-10",
  className = "",
  text = "Buy now",
  showApplePay = true,
  onClick,
  disabled = false,
  loading = false
}) => {
  return (
    <div className={`${width} ${height} flex-shrink-0 ${className}`}>
      <Button 
        className="flex h-10 items-center justify-center gap-1 px-4 py-2 w-full bg-black rounded-[7.9px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        onClick={onClick}
        disabled={disabled || loading}
      >
        <div className="flex items-center justify-center gap-1">
          <div className="[font-family:'Roobert_PRO-Medium',Helvetica] font-medium text-white text-lg text-center tracking-[0] leading-[normal] whitespace-nowrap">
            {loading ? "Processing..." : text}
          </div>

          {showApplePay && !loading && (
            <div className="flex items-center">
              <img
                className="w-[50px] h-[20px]"
                alt="Apple pay icon"
                src="/apple-pay-icon.svg"
              />
            </div>
          )}
        </div>
      </Button>
    </div>
  );
};