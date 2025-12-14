import React, { useState, useEffect } from 'react';
import { Hex } from '../types';

// Hardcoded tool mappings
const TOOL_HEX_LINKS: Record<string, string> = {
  'CHEM-3_9-CHROMA-01': 'https://script.google.com/a/macros/aischennai.org/s/AKfycbwj65yf-OkJDdcSx9CAJlgMzea5CzpMVGg2AAbF727ilJHsJH8sGDgsdXfCvjAH-8M4/exec'
};

interface HexNodeProps {
  hex: Hex;
  isSelected: boolean;
  isBuilderMode: boolean;
  onSelect: (hex: Hex) => void;
  onPositionChange: (hex: Hex, newRow: number, newCol: number) => void;
  gridMetrics: {
    width: number;
    height: number;
    colSpacing: number;
    rowSpacing: number;
  };
  filters?: {
    linkedOnly: boolean;
    sbar: {
        K: boolean;
        T: boolean;
        C: boolean;
    }
  };
}

export const HexNode: React.FC<HexNodeProps> = ({
  hex,
  isSelected,
  isBuilderMode,
  onSelect,
  onPositionChange,
  gridMetrics,
  filters
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // --- Helper: Get Base Link ---
  const getHexBaseLink = (h: Hex) => {
    if (h.id && TOOL_HEX_LINKS[h.id]) {
      return TOOL_HEX_LINKS[h.id];
    }
    return h.linkUrl || null;
  };

  const baseLink = getHexBaseLink(hex);
  const hasLink = !!baseLink;

  // --- Layout Calculation ---
  const getBasePosition = (r: number, c: number) => {
    // Offset every other row
    const xOffset = (r % 2 === 0) ? 0 : gridMetrics.width / 2; // Fixed geometric offset
    const left = c * gridMetrics.colSpacing + xOffset + 20; // +20 margin
    const top = r * gridMetrics.rowSpacing + 20;
    return { x: left, y: top };
  };

  const basePos = getBasePosition(hex.row, hex.col);
  const currentX = isDragging ? dragPos.x : basePos.x;
  const currentY = isDragging ? dragPos.y : basePos.y;

  // --- Size Styles ---
  let width = gridMetrics.width;
  let height = gridMetrics.height;
  let iconSize = 28;
  let textSize = 'text-xs';

  if (hex.size === 'large') {
    width *= 1.3;
    height *= 1.3;
    iconSize = 36;
    textSize = 'text-sm';
  } else if (hex.size === 'small') {
    width *= 0.8;
    height *= 0.8;
    iconSize = 20;
    textSize = 'text-[10px]';
  }

  // --- Visual Config based on Type/Status ---
  // Core = Blue, Student = Violet, Ext = Emerald, Scaf = Amber, Class = Pink
  const getTheme = (type: string, status?: string) => {
    if (status === 'locked') return { fill: '#f8fafc', stroke: '#cbd5e1', text: '#94a3b8', bgOpacity: 0.9 }; // Slate
    
    switch (type) {
        case 'core': return { fill: '#ffffff', stroke: '#3b82f6', text: '#1e293b', bgOpacity: 1 }; // Blue-500
        case 'ext': return { fill: '#ffffff', stroke: '#10b981', text: '#1e293b', bgOpacity: 1 }; // Emerald-500
        case 'scaf': return { fill: '#ffffff', stroke: '#f59e0b', text: '#1e293b', bgOpacity: 1 }; // Amber-500
        case 'student': return { fill: '#8b5cf6', stroke: '#7c3aed', text: '#ffffff', bgOpacity: 1 }; // Violet-500 (Filled)
        case 'class': return { fill: '#ffffff', stroke: '#ec4899', text: '#1e293b', bgOpacity: 1 }; // Pink-500
        default: return { fill: '#ffffff', stroke: '#94a3b8', text: '#334155', bgOpacity: 1 };
    }
  };

  const theme = getTheme(hex.type, hex.status);
  
  // Progress bar color
  const getProgressColor = (progress?: string) => {
    if (progress === 'mastered') return '#a855f7'; // Purple-500
    if (progress === 'completed') return '#22c55e'; // Green-500
    if (progress === 'in_progress') return '#f97316'; // Orange-500
    return 'transparent';
  };

  // --- Drag & Drop Handlers ---
  const startDrag = (clientX: number, clientY: number) => {
    if (!isBuilderMode) return;
    onSelect(hex);
    setIsDragging(true);
    setStartPos({ x: clientX - currentX, y: clientY - currentY });
  };
  
   useEffect(() => {
    if (!isDragging) return;
    const handleMove = (clientX: number, clientY: number) => {
      setDragPos({ x: clientX - startPos.x, y: clientY - startPos.y });
    };
    const handleEnd = () => {
      setIsDragging(false);
      const approxRow = Math.round((dragPos.y - 20) / gridMetrics.rowSpacing);
      const approxRowClean = Math.max(0, approxRow);
      // Correct geometric calculation for drop target
      const isOddRow = approxRowClean % 2 !== 0;
      const xOffset = isOddRow ? gridMetrics.width / 2 : 0;
      const approxCol = Math.round((dragPos.x - 20 - xOffset) / gridMetrics.colSpacing);
      const approxColClean = Math.max(0, approxCol);
      onPositionChange(hex, approxRowClean, approxColClean);
    };
    const onMouseMove = (e: MouseEvent) => { e.preventDefault(); handleMove(e.clientX, e.clientY); };
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd = () => handleEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, dragPos, startPos, gridMetrics, hex, onPositionChange]);

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    if (isBuilderMode) {
        onSelect(hex);
    } else {
        onSelect(hex);
        if (hasLink && baseLink) {
            if (TOOL_HEX_LINKS[hex.id]) {
                const sep = baseLink.indexOf('?') === -1 ? '?' : '&';
                const url = `${baseLink}${sep}view=student&hexId=${encodeURIComponent(hex.id)}`;
                window.open(url, '_blank');
            } else {
                window.open(baseLink, '_blank');
            }
        }
    }
  };

  // --- Filter Logic ---
  let isDimmed = false;
  if (filters) {
    if (filters.linkedOnly && !hasLink) {
        isDimmed = true;
    } else {
        const domains = hex.curriculum?.sbarDomains || [];
        const hasK = domains.some(d => d.includes('K') || d.includes('U'));
        const hasT = domains.some(d => d.includes('T'));
        const hasC = domains.some(d => d.includes('C'));
        const requireK = filters.sbar.K;
        const requireT = filters.sbar.T;
        const requireC = filters.sbar.C;
        if ((requireK || requireT || requireC) && !((requireK && hasK) || (requireT && hasT) || (requireC && hasC))) {
            isDimmed = true;
        }
    }
  }

  // --- SVG Path Construction ---
  // Pointy Topped Hexagon Points
  const p = {
    tm: `${width/2},0`,
    tr: `${width},${height/4}`,
    br: `${width},${height*0.75}`,
    bm: `${width/2},${height}`,
    bl: `${0},${height*0.75}`,
    tl: `${0},${height/4}`
  };
  const points = `${p.tm} ${p.tr} ${p.br} ${p.bm} ${p.bl} ${p.tl}`;

  // Progress Bar Path (Bottom edge segment: bl -> bm -> br)
  const progressPath = `M ${0} ${height*0.75} L ${width/2} ${height} L ${width} ${height*0.75}`;

  return (
    <div
        className={`absolute transition-all duration-200 group
        ${isBuilderMode ? 'cursor-move' : hasLink ? 'cursor-pointer' : 'cursor-default'}
        ${isSelected ? 'z-30 scale-105' : 'z-10 hover:z-40 hover:scale-110'} 
        ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}
        `}
        style={{
            width: width,
            height: height,
            left: currentX,
            top: currentY,
            filter: isSelected ? 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.15))' : 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))'
        }}
        onMouseDown={(e) => { if (isBuilderMode) { e.preventDefault(); startDrag(e.clientX, e.clientY); }}}
        onTouchStart={(e) => { if (isBuilderMode) { startDrag(e.touches[0].clientX, e.touches[0].clientY); }}}
        onClick={handleClick}
        title={hex.label}
    >
        <svg width={width} height={height} className="overflow-visible block">
            {/* Background Hex */}
            <polygon 
                points={points} 
                fill={theme.fill} 
                stroke={theme.stroke} 
                strokeWidth={isSelected ? 4 : 2.5}
                strokeLinejoin="round"
                className="transition-colors duration-200"
            />
            
            {/* Progress Indicator (if not builder and started) */}
            {!isBuilderMode && hex.progress && hex.progress !== 'not_started' && (
                 <path d={progressPath} fill="none" stroke={getProgressColor(hex.progress)} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
            )}
        </svg>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
            {/* Icon */}
            <div style={{ fontSize: iconSize }} className="leading-none mb-1 drop-shadow-sm">{hex.icon || '⬡'}</div>
            
            {/* Label with improved clamping and readability */}
            <div 
                className={`font-bold leading-tight ${textSize} line-clamp-3 px-1`} 
                style={{ 
                    color: theme.text,
                    textShadow: hex.type === 'student' ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 0 rgba(255,255,255,0.8)' // Contrast aid
                }}
            >
                {hex.label}
            </div>
            
             <div className="text-[8px] opacity-0 group-hover:opacity-60 font-mono absolute bottom-4 text-slate-500 transition-opacity">
                {hex.row}, {hex.col}
             </div>
        </div>

        {/* Badges Overlay */}
        {!isBuilderMode && (
            <>
                {hex.curriculum?.sbarDomains?.length ? (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1.5 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap z-30 font-bold tracking-wider border border-white">
                        {hex.curriculum.sbarDomains.join('/')}
                    </div>
                ) : null}
                {hasLink && (
                     <div className="absolute bottom-1 right-2 text-xs opacity-50 z-30 hover:opacity-100">🔗</div>
                )}
            </>
        )}
    </div>
  );
};