
import React, { useState, useEffect } from 'react';
import { Hex } from '../types';

// Hardcoded tool mappings (Legacy support)
const TOOL_HEX_LINKS: Record<string, string> = {
  'CHEM-3_9-CHROMA-01': 'https://script.google.com/a/macros/aischennai.org/s/AKfycbwj65yf-OkJDdcSx9CAJlgMzea5CzpMVGg2AAbF727ilJHsJH8sGDgsdXfCvjAH-8M4/exec'
};

interface HexNodeProps {
  hex: Hex;
  isSelected: boolean;
  isBuilderMode: boolean;
  isConnectionMode: boolean;
  onSelect: (hex: Hex) => void;
  onPositionChange: (hex: Hex, newRow: number, newCol: number) => void;
  onConnectionClick: (hex: Hex) => void;
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
  isConnectionMode,
  onSelect,
  onPositionChange,
  onConnectionClick,
  gridMetrics,
  filters
}) => {
  // Local state for dragging visual override
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    currentX: number;
    currentY: number;
  } | null>(null);

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
    // Ensure r and c are numbers to avoid NaN
    const row = Number(r) || 0;
    const col = Number(c) || 0;
    
    const xOffset = (row % 2 === 0) ? 0 : gridMetrics.width / 2; 
    const left = col * gridMetrics.colSpacing + xOffset + 20; 
    const top = row * gridMetrics.rowSpacing + 20;
    return { x: left, y: top };
  };

  const basePos = getBasePosition(hex.row, hex.col);
  
  // Use drag position if dragging, otherwise computed base position
  const currentX = dragState?.isDragging ? dragState.currentX : basePos.x;
  const currentY = dragState?.isDragging ? dragState.currentY : basePos.y;

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

  // --- Theme ---
  const getTheme = (type: string, status?: string) => {
    if (status === 'locked') return { fill: '#f1f5f9', stroke: '#94a3b8', text: '#64748b' };
    switch (type) {
        case 'core': return { fill: '#eff6ff', stroke: '#2563eb', text: '#1e3a8a' };
        case 'ext': return { fill: '#f0fdf4', stroke: '#059669', text: '#064e3b' };
        case 'scaf': return { fill: '#fffbeb', stroke: '#d97706', text: '#78350f' };
        case 'student': return { fill: '#f5f3ff', stroke: '#7c3aed', text: '#4c1d95' };
        case 'class': return { fill: '#fdf2f8', stroke: '#db2777', text: '#831843' };
        default: return { fill: '#ffffff', stroke: '#cbd5e1', text: '#334155' };
    }
  };
  const theme = getTheme(hex.type, hex.status);
  
  const getProgressColor = (progress?: string) => {
    if (progress === 'mastered') return '#9333ea';
    if (progress === 'completed') return '#16a34a';
    if (progress === 'in_progress') return '#ea580c';
    return 'transparent';
  };

  // --- Global Mouse Listeners for Dragging ---
  useEffect(() => {
    if (!dragState?.isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      e.preventDefault(); 
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      
      setDragState(prev => prev ? ({ 
        ...prev, 
        currentX: prev.initialLeft + dx, 
        currentY: prev.initialTop + dy 
      }) : null);
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      
      if (dragState) {
        const finalX = dragState.initialLeft + (e.clientX - dragState.startX);
        const finalY = dragState.initialTop + (e.clientY - dragState.startY);

        const approxRow = Math.round((finalY - 20) / gridMetrics.rowSpacing);
        const approxRowClean = Math.max(0, approxRow);
        
        const isOddRow = approxRowClean % 2 !== 0;
        const xOffset = isOddRow ? gridMetrics.width / 2 : 0;
        
        const approxCol = Math.round((finalX - 20 - xOffset) / gridMetrics.colSpacing);
        const approxColClean = Math.max(0, approxCol);

        onPositionChange(hex, approxRowClean, approxColClean);
      }
      
      setDragState(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, gridMetrics, hex, onPositionChange]);


  // --- Event Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
      if (isConnectionMode) {
          e.stopPropagation();
          return; 
      }

      if (isBuilderMode) {
          if (e.button !== 0) return; 
          e.preventDefault(); 
          e.stopPropagation();
          
          onSelect(hex);

          // Force fresh basePos calculation to ensure no stale closure
          const startPos = getBasePosition(hex.row, hex.col);

          setDragState({
              isDragging: true,
              startX: e.clientX,
              startY: e.clientY,
              initialLeft: startPos.x,
              initialTop: startPos.y,
              currentX: startPos.x,
              currentY: startPos.y
          });
          return;
      }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragState?.isDragging) return;

    if (isConnectionMode) {
        onConnectionClick(hex);
        return;
    }

    onSelect(hex);
    
    if (!isBuilderMode && hasLink && baseLink) {
        if (TOOL_HEX_LINKS[hex.id]) {
            const sep = baseLink.indexOf('?') === -1 ? '?' : '&';
            const url = `${baseLink}${sep}view=student&hexId=${encodeURIComponent(hex.id)}`;
            window.open(url, '_blank');
        } else {
            window.open(baseLink, '_blank');
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
  const p = {
    tm: `${width/2},0`,
    tr: `${width},${height/4}`,
    br: `${width},${height*0.75}`,
    bm: `${width/2},${height}`,
    bl: `${0},${height*0.75}`,
    tl: `${0},${height/4}`
  };
  const points = `${p.tm} ${p.tr} ${p.br} ${p.bm} ${p.bl} ${p.tl}`;
  const progressPath = `M ${0} ${height*0.75} L ${width/2} ${height} L ${width} ${height*0.75}`;

  let cursorClass = 'cursor-default';
  if (isConnectionMode) cursorClass = 'cursor-crosshair';
  else if (isBuilderMode) cursorClass = 'cursor-move';
  else if (hasLink) cursorClass = 'cursor-pointer';

  return (
    <div
        className={`absolute group ${cursorClass} ${isSelected ? 'z-30' : 'z-10 hover:z-20'}`}
        style={{
            width: width,
            height: height,
            left: currentX,
            top: currentY,
            opacity: isDimmed ? 0.3 : (dragState?.isDragging ? 0.9 : 1),
            filter: isDimmed ? 'grayscale(100%)' : (isSelected || dragState?.isDragging ? 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.15))' : 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))'),
            transform: isSelected || dragState?.isDragging ? 'scale(1.05)' : 'scale(1)',
            transition: dragState?.isDragging ? 'none' : 'transform 0.1s ease-out, left 0.2s ease-out, top 0.2s ease-out',
            touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        title={hex.label}
    >
        <svg width={width} height={height} className="overflow-visible block">
            <polygon 
                points={points} 
                fill={theme.fill} 
                stroke={theme.stroke} 
                strokeWidth={isSelected ? 4 : 3} 
                strokeLinejoin="round"
                className="transition-colors duration-200"
            />
            
            {!isBuilderMode && hex.progress && hex.progress !== 'not_started' && (
                 <path d={progressPath} fill="none" stroke={getProgressColor(hex.progress)} strokeWidth="6" strokeLinecap="round" opacity="1" />
            )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
            <div style={{ fontSize: iconSize }} className="leading-none mb-1 drop-shadow-sm">{hex.icon || '⬡'}</div>
            
            <div 
                className={`font-semibold leading-tight ${textSize} line-clamp-3 px-1`} 
                style={{ color: theme.text }}
            >
                {hex.label}
            </div>
            
             <div className="text-[9px] opacity-0 group-hover:opacity-100 font-mono font-bold absolute bottom-4 text-slate-600 transition-opacity bg-white/80 px-1 rounded">
                {hex.row}, {hex.col}
             </div>
        </div>

        {!isBuilderMode && (
            <>
                {hex.curriculum?.sbarDomains?.length ? (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap z-30 font-bold tracking-wider border-2 border-white">
                        {hex.curriculum.sbarDomains.join('/')}
                    </div>
                ) : null}
                {hasLink && (
                     <div className="absolute bottom-2 right-3 text-xs opacity-70 z-30 hover:opacity-100 bg-white rounded-full p-0.5 shadow-sm">🔗</div>
                )}
            </>
        )}
    </div>
  );
};