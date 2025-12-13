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
    const xOffset = (r % 2 === 0) ? 0 : gridMetrics.colSpacing / 2;
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
  let iconSize = 24;
  let textSize = 'text-xs';

  if (hex.size === 'large') {
    width *= 1.3;
    height *= 1.3;
    iconSize = 32;
    textSize = 'text-sm';
  } else if (hex.size === 'small') {
    width *= 0.8;
    height *= 0.8;
    iconSize = 18;
    textSize = 'text-[10px]';
  }

  // --- Visual Config based on Type/Status ---
  // Core = Blue, Student = Violet, Ext = Emerald, Scaf = Amber, Class = Pink
  const getTheme = (type: string, status?: string) => {
    if (status === 'locked') return { fill: '#f1f5f9', stroke: '#cbd5e1', text: '#94a3b8' }; // Slate-100/300/400
    
    switch (type) {
        case 'core': return { fill: '#ffffff', stroke: '#3b82f6', text: '#334155' }; // Blue-500
        case 'ext': return { fill: '#ffffff', stroke: '#10b981', text: '#334155' }; // Emerald-500
        case 'scaf': return { fill: '#ffffff', stroke: '#f59e0b', text: '#334155' }; // Amber-500
        case 'student': return { fill: '#8b5cf6', stroke: '#7c3aed', text: '#ffffff' }; // Violet-500/600
        case 'class': return { fill: '#ffffff', stroke: '#ec4899', text: '#334155' }; // Pink-500
        default: return { fill: '#ffffff', stroke: '#94a3b8', text: '#334155' };
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
      const isOddRow = approxRowClean % 2 !== 0;
      const xOffset = isOddRow ? gridMetrics.colSpacing / 2 : 0;
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
        className={`absolute transition-transform duration-200 
        ${isBuilderMode ? 'cursor-move' : hasLink ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
        ${isSelected ? 'z-20' : 'z-10 hover:z-20'}
        ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}
        `}
        style={{
            width: width,
            height: height,
            left: currentX,
            top: currentY,
            // SVG Filter handles shadow, but CSS filter is easier for the whole shape
            filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))'
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
                strokeWidth={isSelected ? 4 : 2}
                className="transition-colors duration-200"
            />
            
            {/* Progress Indicator (if not builder and started) */}
            {!isBuilderMode && hex.progress && hex.progress !== 'not_started' && (
                 <path d={progressPath} fill="none" stroke={getProgressColor(hex.progress)} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
            )}
        </svg>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2 text-center">
            <div style={{ fontSize: iconSize }} className="leading-none mb-1">{hex.icon || '⬡'}</div>
            <div 
                className={`font-bold leading-tight ${textSize} line-clamp-2 px-1`} 
                style={{ color: theme.text }}
            >
                {hex.label}
            </div>
            
             <div className="text-[8px] opacity-40 font-mono absolute bottom-4 text-slate-500">
                {hex.row}, {hex.col}
             </div>
        </div>

        {/* Badges Overlay */}
        {!isBuilderMode && (
            <>
                {hex.curriculum?.sbarDomains?.length ? (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 bg-slate-800 text-white text-[9px] px-1.5 rounded-full shadow-sm whitespace-nowrap z-30">
                        {hex.curriculum.sbarDomains.join('/')}
                    </div>
                ) : null}
                {hasLink && (
                     <div className="absolute bottom-1 right-2 text-xs opacity-50 z-30">🔗</div>
                )}
            </>
        )}
    </div>
  );
};