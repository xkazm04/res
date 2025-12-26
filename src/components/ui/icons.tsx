'use client';

// Re-export commonly used Lucide icons with consistent sizing
import {
  Search,
  FileText,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ExternalLink,
  Link2,
  Globe,
  Building2,
  User,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  SortDesc,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Move,
  Grip,
  MoreHorizontal,
  MoreVertical,
  Plus,
  X,
  RefreshCw,
  Download,
  Share2,
  Copy,
  Bookmark,
  Star,
  Flag,
  MessageSquare,
  FileQuestion,
  Network,
  GitBranch,
  CircleDot,
  Activity,
  BarChart2,
  PieChart,
  Layers,
  Target,
  Award,
  Shield,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  type LucideProps,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export {
  Search,
  FileText,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ExternalLink,
  Link2,
  Globe,
  Building2,
  User,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  SortDesc,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Move,
  Grip,
  MoreHorizontal,
  MoreVertical,
  Plus,
  X,
  RefreshCw,
  Download,
  Share2,
  Copy,
  Bookmark,
  Star,
  Flag,
  MessageSquare,
  FileQuestion,
  Network,
  GitBranch,
  CircleDot,
  Activity,
  BarChart2,
  PieChart,
  Layers,
  Target,
  Award,
  Shield,
  AlertCircle,
  HelpCircle,
  Lightbulb,
};

// Custom wrapper with default sizing
interface IconProps extends LucideProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

export function Icon({ size = 'md', className, ...props }: IconProps & { icon: React.ElementType }) {
  const IconComponent = props.icon;
  return <IconComponent size={sizeMap[size]} className={cn('shrink-0', className)} {...props} />;
}

// Entity type icons
export function EntityTypeIcon({ type, className }: { type: string; className?: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    person: <User className={cn('w-4 h-4', className)} />,
    organization: <Building2 className={cn('w-4 h-4', className)} />,
    location: <MapPin className={cn('w-4 h-4', className)} />,
    product: <Layers className={cn('w-4 h-4', className)} />,
    concept: <CircleDot className={cn('w-4 h-4', className)} />,
    event: <Calendar className={cn('w-4 h-4', className)} />,
  };
  return iconMap[type] || <CircleDot className={cn('w-4 h-4', className)} />;
}

// Finding type icons
export function FindingTypeIcon({ type, className }: { type: string; className?: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    fact: <CheckCircle className={cn('w-4 h-4', className)} />,
    claim: <MessageSquare className={cn('w-4 h-4', className)} />,
    event: <Calendar className={cn('w-4 h-4', className)} />,
    actor: <User className={cn('w-4 h-4', className)} />,
    relationship: <Link2 className={cn('w-4 h-4', className)} />,
    pattern: <Activity className={cn('w-4 h-4', className)} />,
    gap: <FileQuestion className={cn('w-4 h-4', className)} />,
    evidence: <FileText className={cn('w-4 h-4', className)} />,
  };
  return iconMap[type] || <CircleDot className={cn('w-4 h-4', className)} />;
}

// Confidence indicator
export function ConfidenceIcon({ score, className }: { score: number; className?: string }) {
  if (score >= 0.8) return <CheckCircle className={cn('w-4 h-4 text-emerald-500', className)} />;
  if (score >= 0.5) return <AlertCircle className={cn('w-4 h-4 text-amber-500', className)} />;
  return <HelpCircle className={cn('w-4 h-4 text-zinc-400', className)} />;
}

// Trend indicator
export function TrendIcon({ direction, className }: { direction: 'up' | 'down' | 'neutral'; className?: string }) {
  if (direction === 'up') return <TrendingUp className={cn('w-4 h-4 text-emerald-500', className)} />;
  if (direction === 'down') return <TrendingDown className={cn('w-4 h-4 text-red-500', className)} />;
  return <Minus className={cn('w-4 h-4 text-zinc-400', className)} />;
}
