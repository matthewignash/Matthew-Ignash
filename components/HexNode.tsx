import React, { useState, useEffect } from 'react';
import { Hex } from '../types';

// Hardcoded tool mappings from Module 05
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
  let fontSizeIcon = 'text-2xl';
  let fontSizeText = 'text-xs';

  if (hex.size === 'large') {
    width *= 1.3;
    height *= 1.3;
    fontSizeIcon = 'text-3xl';
    fontSizeText = 'text-sm';
  } else if (hex.size === 'small') {
    width *= 0.8;
    height *= 0.8;
    fontSizeIcon = 'text-lg';
    fontSizeText = 'text-[10px]';
  }

  // --- Type Styles ---
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'student': return 'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-violet-500/40 ring-violet-500';
      case 'class': return 'bg-white text-slate-700 shadow-pink-500/20 ring-pink-500 ring-2';
      case 'core': return 'bg-white text-slate-700 shadow-blue-500/20 ring-blue-500 ring-2';
      case 'ext': return 'bg-white text-slate-700 shadow-emerald-500/20 ring-emerald-500 ring-2';
      case 'scaf': return 'bg-white text-slate-700 shadow-orange-500/20 ring-orange-500 ring-2';
      default: return 'bg-white text-slate-700 shadow-slate-500/20 ring-slate-400 ring-2';
    }
  };

  const getStatusStyles = (status?: string) => {
    if (status === 'locked') return 'opacity-60 grayscale bg-slate-200 ring-slate-300';
    if (status === 'completed') return 'bg-gradient-to-br from-emerald-50 to-emerald-100 ring-emerald-500';
    return '';
  };
  
  const getProgressColor = (progress?: string) => {
    if (progress === 'mastered') return 'bg-purple-500';
    if (progress === 'completed') return 'bg-green-500';
    if (progress === 'in_progress') return 'bg-orange-500';
    return 'bg-slate-200';
  };

  // --- Drag & Drop Handlers ---
  const startDrag = (clientX: number, clientY: number) => {
    if (!isBuilderMode) return;
    onSelect(hex);
    setIsDragging(true);
    setStartPos({ x: clientX - currentX, y: clientY - currentY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isBuilderMode) return;
    e.preventDefault(); // Prevent text selection
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isBuilderMode) return;
    // e.preventDefault(); // Handled in move listener to prevent scrolling
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  // Global move/up listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      setDragPos({
        x: clientX - startPos.x,
        y: clientY - startPos.y
      });
    };

    const handleEnd = () => {
      setIsDragging(false);

      // Snap to grid
      const approxRow = Math.round((dragPos.y - 20) / gridMetrics.rowSpacing);
      const approxRowClean = Math.max(0, approxRow);
      
      const isOddRow = approxRowClean % 2 !== 0;
      const xOffset = isOddRow ? gridMetrics.colSpacing / 2 : 0;
      
      const approxCol = Math.round((dragPos.x - 20 - xOffset) / gridMetrics.colSpacing);
      const approxColClean = Math.max(0, approxCol);

      onPositionChange(hex, approxRowClean, approxColClean);
    };

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      handleEnd();
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Important: prevents scrolling
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = () => {
      handleEnd();
    };

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

  // --- Click Handler ---
  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    
    if (isBuilderMode) {
        onSelect(hex);
    } else {
        // Viewer/Student Mode
        onSelect(hex); // Also select to show details in panel
        
        if (hasLink && baseLink) {
            // Logic from Module 05: Append view param if it's a tool link
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
        const anySbarFilter = requireK || requireT || requireC;

        if (anySbarFilter) {
            const hexHasRequiredTag = (requireK && hasK) || (requireT && hasT) || (requireC && hasC);
            if (!hexHasRequiredTag) {
                isDimmed = true;
            }
        }
    }
  }

  // --- Tooltip Construction ---
  const getTooltip = () => {
    const lines = [];
    lines.push(`${hex.label || hex.id || 'Untitled'} [${hex.type.toUpperCase()}]`);
    if (hex.status) lines.push(`Status: ${hex.status}`);
    
    const cur = hex.curriculum || {};
    if (cur.sbarDomains?.length) lines.push(`SBAR: ${cur.sbarDomains.join(', ')}`);
    if (cur.standards?.length) lines.push(`Standards: ${cur.standards.join(', ')}`);
    if (cur.atlSkills?.length) lines.push(`ATL: ${cur.atlSkills.join(', ')}`);
    if (cur.competencies?.length) lines.push(`Competencies: ${cur.competencies.join(', ')}`);
    
    const pLabel = hex.progress === 'mastered' ? 'Mastered' : 
                   hex.progress === 'completed' ? 'Completed' :
                   hex.progress === 'in_progress' ? 'In Progress' : 'Not Started';
    lines.push(`Progress: ${pLabel}`);
    
    return lines.join('\n');
  };

  return (
    <div
      className={`absolute flex justify-center items-center transition-transform duration-200 
        ${isBuilderMode ? 'cursor-move' : hasLink ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
        ${isSelected ? 'z-20' : 'z-0 hover:z-10'}
        ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}
      `}
      style={{
        width: `${width}px`,
        height: `${height * 1.1}px`, // Slight wrapper height increase
        left: `${currentX}px`,
        top: `${currentY}px`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      <div 
        className={`w-full h-full flex flex-col items-center justify-center p-2 shadow-lg transition-all duration-200 relative
          ${getTypeStyles(hex.type)}
          ${getStatusStyles(hex.status)}
          ${isSelected ? 'ring-4 ring-offset-2 ring-sky-500' : ''}
        `}
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
        title={getTooltip()}
      >
        <div className={`mb-1 ${fontSizeIcon} leading-none`}>{hex.icon || '⬡'}</div>
        <div className={`font-bold text-center leading-tight ${fontSizeText} ${hex.type === 'student' ? 'text-white' : 'text-slate-600'}`}>
          {hex.label || 'Untitled'}
        </div>
        <div className="text-[9px] opacity-40 mt-1 font-mono">
          {hex.row}, {hex.col}
        </div>
        
        {/* Student View: SBAR Tag */}
        {!isBuilderMode && hex.curriculum?.sbarDomains && hex.curriculum.sbarDomains.length > 0 && (
          <div className="absolute top-1 left-1 bg-slate-900/75 text-white text-[8px] rounded-full px-1.5 py-0.5 max-w-[80%] truncate">
            {hex.curriculum.sbarDomains.join('/')}
          </div>
        )}

        {/* Student View: Link Indicator */}
        {hasLink && !isBuilderMode && (
          <div className="absolute bottom-2 right-4 text-xs opacity-70">🔗</div>
        )}

        {/* Student View: Progress Strip */}
        {!isBuilderMode && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
            <div className={`h-full w-full transition-colors ${getProgressColor(hex.progress)}`}></div>
          </div>
        )}
      </div>
    </div>
  );
};