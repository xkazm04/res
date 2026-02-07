'use client';

interface SafeZoneOverlayProps {
  visible: boolean;
  width: number;
  height: number;
}

/**
 * Safe Zone Overlay for YouTube Shorts
 * Shows areas where platform UI (comments, likes, etc.) covers content
 *
 * YouTube Shorts safe zones:
 * - Top: ~60px for status bar and title
 * - Bottom: ~120px for comments, like button, share button
 * - Right side: ~48px for action buttons (like, comment, share)
 */
export function SafeZoneOverlay({ visible, width, height }: SafeZoneOverlayProps) {
  if (!visible) return null;

  // Calculate safe zone insets based on aspect ratio
  // These are approximate values for 9:16 YouTube Shorts format
  const topInset = Math.round(height * 0.08);    // ~8% for status bar
  const bottomInset = Math.round(height * 0.15); // ~15% for bottom UI
  const rightInset = Math.round(width * 0.12);   // ~12% for action buttons

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Top danger zone - status bar and title */}
      <div
        className="absolute top-0 left-0 right-0 bg-red-500/20 border-b-2 border-dashed border-red-500/50"
        style={{ height: topInset }}
      >
        <span className="absolute bottom-1 left-2 text-[8px] text-red-400 font-medium">
          Status Bar
        </span>
      </div>

      {/* Bottom danger zone - comments, actions */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-red-500/20 border-t-2 border-dashed border-red-500/50"
        style={{ height: bottomInset }}
      >
        <span className="absolute top-1 left-2 text-[8px] text-red-400 font-medium">
          Comments & Actions
        </span>
      </div>

      {/* Right side danger zone - like, comment, share buttons */}
      <div
        className="absolute top-0 bottom-0 right-0 bg-orange-500/15 border-l-2 border-dashed border-orange-500/40"
        style={{
          width: rightInset,
          top: topInset,
          bottom: bottomInset,
        }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 right-1 flex flex-col gap-3">
          {/* Mock action buttons */}
          <div className="w-6 h-6 rounded-full bg-orange-500/30 border border-orange-500/50" />
          <div className="w-6 h-6 rounded-full bg-orange-500/30 border border-orange-500/50" />
          <div className="w-6 h-6 rounded-full bg-orange-500/30 border border-orange-500/50" />
        </div>
      </div>

      {/* Safe zone indicator - the actual safe area */}
      <div
        className="absolute border-2 border-dashed border-green-500/50 rounded"
        style={{
          top: topInset + 4,
          bottom: bottomInset + 4,
          left: 4,
          right: rightInset + 4,
        }}
      >
        <span className="absolute -top-5 left-0 text-[8px] text-green-400 font-medium bg-slate-900/80 px-1 rounded">
          Safe Zone
        </span>
      </div>
    </div>
  );
}
