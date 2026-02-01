'use client';

/**
 * Custom SVG Icons for Video Scenes
 *
 * Replaces emojis with consistent, professional SVG icons
 * that scale properly and match the template themes.
 */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// ============================================
// TEMPLATE-SPECIFIC ICONS
// ============================================

/** Investigative - Magnifying glass with focus lines */
export function InvestigativeIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="10" cy="10" r="6" stroke={color} strokeWidth="2" />
      <path d="M14.5 14.5L20 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M10 7V10M10 10V13M10 10H7M10 10H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Financial - Bull/Bear chart */
export function FinancialIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 17L8 12L12 15L21 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 6H21V10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 21H21" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** Competitive - Crossed swords */
export function CompetitiveIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 5L12 12M5 5V9M5 5H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 5L12 12M19 5V9M19 5H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12V19" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 16H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Legal - Balanced scales */
export function LegalIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 7H19" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 7L3 14H7L5 7Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.2" />
      <path d="M19 7L17 14H21L19 7Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.2" />
      <path d="M8 21H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Tech Market - Circuit/chip pattern */
export function TechMarketIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="6" width="12" height="12" rx="2" stroke={color} strokeWidth="2" />
      <path d="M9 1V6M15 1V6M9 18V23M15 18V23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1 9H6M1 15H6M18 9H23M18 15H23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill={color} fillOpacity="0.4" />
    </svg>
  );
}

/** Contract - Document with seal */
export function ContractIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 2H14L18 6V22H6V2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 2V6H18" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 10H15M9 14H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="15" cy="18" r="2.5" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

/** Understanding - Brain/insight */
export function UnderstandingIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8 2 5 5 5 9C5 11.5 6.5 13.5 8 14.5V17H16V14.5C17.5 13.5 19 11.5 19 9C19 5 16 2 12 2Z" stroke={color} strokeWidth="2" />
      <path d="M9 21H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M10 17V19H14V17" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="9" r="2" fill={color} fillOpacity="0.4" />
    </svg>
  );
}

/** Due Diligence - Shield with checkmark */
export function DueDiligenceIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Purchase Decision - Shopping/cart with analysis */
export function PurchaseIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6H22L20 16H8L6 6Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 6L4 2H2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="18" cy="20" r="2" stroke={color} strokeWidth="1.5" />
      <path d="M12 10L14 12L18 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

/** Reputation - Star shield */
export function ReputationIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L4 6V11C4 16.5 7.8 21.7 12 23C16.2 21.7 20 16.5 20 11V6L12 2Z" stroke={color} strokeWidth="2" />
      <path d="M12 7L13.5 10H16.5L14 12L15 15L12 13L9 15L10 12L7.5 10H10.5L12 7Z" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1" />
    </svg>
  );
}

// ============================================
// STATUS & SEVERITY ICONS
// ============================================

export function WarningIcon({ size = 16, color = '#f59e0b', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L2 22H22L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
      <path d="M12 9V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill={color} />
    </svg>
  );
}

export function CriticalIcon({ size = 16, color = '#ef4444', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      <path d="M12 7V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill={color} />
    </svg>
  );
}

export function SuccessIcon({ size = 16, color = '#22c55e', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoIcon({ size = 16, color = '#3b82f6', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      <path d="M12 11V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill={color} />
    </svg>
  );
}

// ============================================
// TREND & DIRECTION ICONS
// ============================================

export function TrendUpIcon({ size = 16, color = '#22c55e', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 17L12 10L15 13L21 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7H21V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrendDownIcon({ size = 16, color = '#ef4444', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 7L12 14L15 11L21 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 17H21V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrendStableIcon({ size = 16, color = '#64748b', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 8L20 12L16 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================
// ACTION & UI ICONS
// ============================================

export function MoneyIcon({ size = 20, color = '#22c55e', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M12 6V18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 9C15 7.5 13.5 7 12 7C10.5 7 9 7.5 9 9C9 10.5 10.5 11 12 11.5C13.5 12 15 12.5 15 14C15 15.5 13.5 17 12 17C10.5 17 9 16.5 9 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function NetworkIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="5" r="3" stroke={color} strokeWidth="2" />
      <circle cx="5" cy="18" r="3" stroke={color} strokeWidth="2" />
      <circle cx="19" cy="18" r="3" stroke={color} strokeWidth="2" />
      <path d="M12 8V12M12 12L6 16M12 12L18 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FlagIcon({ size = 20, color = '#ef4444', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 3V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 4H17L14 8L17 12H5" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" strokeLinejoin="round" />
    </svg>
  );
}

export function TargetIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function PersonIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
      <path d="M4 21C4 17 7.5 14 12 14C16.5 14 20 17 20 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ChainIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M10 14L14 10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M15 9L17 7C18.5 5.5 18.5 3 17 1.5C15.5 0 13 0 11.5 1.5L9 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 15L7 17C5.5 18.5 5.5 21 7 22.5C8.5 24 11 24 12.5 22.5L15 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LockIcon({ size = 16, color = '#f59e0b', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <path d="M8 11V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill={color} />
    </svg>
  );
}

/** Web/Network structure - for shell companies */
export function WebIcon({ size = 20, color = '#f59e0b', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="2" fill={color} />
      <circle cx="12" cy="4" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="19" cy="8" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="19" cy="16" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="20" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="5" cy="16" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="5" cy="8" r="2" stroke={color} strokeWidth="1.5" />
      <path d="M12 6V10M12 14V18M14 12H17M10 12H7M13.5 10.5L17 8M13.5 13.5L17 16M10.5 10.5L7 8M10.5 13.5L7 16" stroke={color} strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

/** Theatre masks - for hype vs reality */
export function MaskIcon({ size = 20, color = '#8b5cf6', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 8C4 5 6 3 9 3C12 3 14 5 14 8V12C14 15 12 17 9 17C6 17 4 15 4 12V8Z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      <circle cx="7" cy="9" r="1" fill={color} />
      <circle cx="11" cy="9" r="1" fill={color} />
      <path d="M6 13C6 13 7 14 9 14C11 14 12 13 12 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 10C14 7 16 5 19 5C21 5 22 6 22 8V11C22 14 20 16 17 16" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <circle cx="18" cy="10" r="0.75" fill={color} />
      <path d="M16 12.5C16 12.5 16.5 12 17.5 12" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** Swap/alternatives icon */
export function SwapIcon({ size = 20, color = '#22c55e', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 8H16M16 8L12 4M16 8L12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16H8M8 16L12 12M8 16L12 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** News/document icon */
export function NewsIcon({ size = 20, color = '#3b82f6', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <path d="M7 7H17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 11H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M7 15H12" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Puzzle piece icon */
export function PuzzleIcon({ size = 20, color = '#a855f7', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 8H6C6 6.5 7.5 5 9 5C10.5 5 12 6.5 12 8H14V10C15.5 10 17 11.5 17 13C17 14.5 15.5 16 14 16V18H4V8Z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" strokeLinejoin="round" />
      <path d="M14 8V6C15.5 6 17 4.5 17 3C17 3 19 3 20 4C21 5 21 7 21 7C19.5 7 18 8.5 18 10H20V20H14" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** Arrow down icon for flows */
export function ArrowDownIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5V19" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 13L12 19L6 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Arrow right icon for flows */
export function ArrowRightIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12H19" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M13 6L19 12L13 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Simple check mark */
export function CheckIcon({ size = 16, color = '#22c55e', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Minus/dash icon for cons */
export function MinusIcon({ size = 16, color = '#64748b', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12H19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Filled star for ratings */
export function StarIcon({ size = 16, color = '#f59e0b', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L14.4 9.2H22L16 13.8L18.4 21L12 16.4L5.6 21L8 13.8L2 9.2H9.6L12 2Z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

/** Lightbulb for insights */
export function LightbulbIcon({ size = 20, color = '#f59e0b', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 21H15M10 17.5V19H14V17.5M12 2C8.5 2 6 4.5 6 8C6 10.5 7.5 12.5 9 14H15C16.5 12.5 18 10.5 18 8C18 4.5 15.5 2 12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6V10M10 8H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** Split compare icon for narrative comparison */
export function SplitCompareIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="8" height="16" rx="1" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <rect x="13" y="4" width="8" height="16" rx="1" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <path d="M6 8H8M6 12H8M6 16H8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M16 8H18M16 12H18M16 16H18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Money with hidden portion */
export function HiddenCostIcon({ size = 20, color = '#ef4444', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M12 6V18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 9H15M9 15H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 21L21 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ============================================
// UTILITY FUNCTION
// ============================================

export function getTemplateIcon(templateType: string): React.ComponentType<IconProps> {
  const icons: Record<string, React.ComponentType<IconProps>> = {
    investigative: InvestigativeIcon,
    financial: FinancialIcon,
    competitive: CompetitiveIcon,
    legal: LegalIcon,
    tech_market: TechMarketIcon,
    contract: ContractIcon,
    understanding: UnderstandingIcon,
    due_diligence: DueDiligenceIcon,
    purchase_decision: PurchaseIcon,
    reputation: ReputationIcon,
  };
  return icons[templateType] || InvestigativeIcon;
}

export function getSeverityIcon(severity: string): React.ComponentType<IconProps> {
  const icons: Record<string, React.ComponentType<IconProps>> = {
    critical: CriticalIcon,
    high: WarningIcon,
    medium: InfoIcon,
    low: InfoIcon,
    success: SuccessIcon,
    warning: WarningIcon,
    error: CriticalIcon,
    info: InfoIcon,
  };
  return icons[severity] || InfoIcon;
}
