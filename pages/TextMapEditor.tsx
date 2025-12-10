import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Copy, ClipboardType, Type, Settings2, Grid3X3, Download, Upload, X } from 'lucide-react';

const TextMapEditor: React.FC = () => {
  const MAX_SIZE = 40;
  
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  const [fontFamily, setFontFamily] = useState("'MS Gothic', monospace");
  const [mapData, setMapData] = useState<string[]>([]);
  const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  
  // Font availability state
  const [fontsAvailable, setFontsAvailable] = useState({
    "'MS Gothic', monospace": true,
    "'ERA MONO SC'": false,
    "'EraPixel'": false
  });

  // Character palettes
  const boxDrawingRows = [
    "┌┬┐┏┳┓╔╦╗╭─╮",
    "├┼┤┣╋┫╠╬╣│╳┃",
    "└┴┘┗┻┛╚╩╝╰━╯",
    "┍┑┎┒╒╕╓╖╱╲┄┅",
    "┕┙┖┚╘╛╙╜╲╱┆┇"
  ];
  
  const specialChars = "① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩ ♨ ✟ ※ ◎ □ ■ ♠ ♥ ♦ ♣ Ｘ";
  
  // Initialize map
  useEffect(() => {
    // Fill with default X if empty
    if (mapData.length === 0) {
      const initialMap = Array(rows).fill('Ｘ'.repeat(cols));
      setMapData(initialMap);
    }
  }, []);

  // Check fonts
  useLayoutEffect(() => {
    const checkFont = (font: string) => {
      // document.fonts.check is supported in modern browsers
      if (document.fonts && document.fonts.check) {
        return document.fonts.check(`12px ${font}`);
      }
      return true; // Fallback to assuming true if API not supported
    };

    setFontsAvailable({
      "'MS Gothic', monospace": true, // Always allow default
      "'ERA MONO SC'": checkFont("'ERA MONO SC'"),
      "'EraPixel'": checkFont("'EraPixel'")
    });
  }, []);

  // Handle Resize
  const updateSize = (newRows: number, newCols: number) => {
    // Clamp values
    const r = Math.min(MAX_SIZE, Math.max(1, newRows));
    const c = Math.min(MAX_SIZE, Math.max(1, newCols));
    
    setRows(r);
    setCols(c);

    setMapData(prev => {
      const newMap = [...prev];
      
      // Adjust rows
      if (r > newMap.length) {
        // Add new rows
        const emptyRow = 'Ｘ'.repeat(c);
        for (let i = newMap.length; i < r; i++) {
          newMap.push(emptyRow);
        }
      } else if (r < newMap.length) {
        // Remove rows
        newMap.splice(r);
      }

      // Adjust columns for each row
      return newMap.map(row => {
        if (c > row.length) {
          return row + 'Ｘ'.repeat(c - row.length);
        } else if (c < row.length) {
          return row.substring(0, c);
        }
        return row;
      });
    });
  };

  const handleRowChange = (index: number, value: string) => {
    const newMap = [...mapData];
    newMap[index] = value;
    setMapData(newMap);
  };

  const copyToClipboard = (text: string, rowIndex?: number) => {
    navigator.clipboard.writeText(text);
    if (rowIndex !== undefined) {
      setCopiedRowIndex(rowIndex);
      setTimeout(() => setCopiedRowIndex(null), 1000);
    }
  };

  const copySymbol = (char: string) => {
    navigator.clipboard.writeText(char);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setIsImportModalOpen(false);
      return;
    }

    const lines = importText.split('\n');
    // Calculate new dimensions based on import
    const newRows = Math.min(MAX_SIZE, lines.length);
    let maxLen = 0;
    lines.forEach(line => {
      // Basic length check
      if (line.length > maxLen) maxLen = line.length;
    });
    const newCols = Math.min(MAX_SIZE, Math.max(1, maxLen));

    // Update dimensions
    setRows(newRows);
    setCols(newCols);

    // Build new map data
    const newMapData: string[] = [];
    for (let i = 0; i < newRows; i++) {
      let line = lines[i] || "";
      // Truncate if too long
      if (line.length > newCols) {
        line = line.substring(0, newCols);
      }
      // Pad if too short
      if (line.length < newCols) {
        line = line + 'Ｘ'.repeat(newCols - line.length);
      }
      newMapData.push(line);
    }

    setMapData(newMapData);
    setImportText('');
    setIsImportModalOpen(false);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full animate-in fade-in duration-500 items-start pb-20">
      
      {/* LEFT PANEL: Editor */}
      <div className="flex-1 w-full bg-[#f0f0eb] rounded-[2.5rem] p-4 md:p-8 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(0,0,0,0.1)] border-4 border-white relative">
        
        {/* Header / Control Panel */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 pb-6 border-b-2 border-zinc-300 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-zinc-800 rounded-xl shadow-lg">
              <Settings2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="font-black uppercase tracking-widest text-xl text-zinc-800">地图参数</h2>
              <span className="text-[10px] font-mono font-bold text-zinc-400">MAP_CONFIG_V3</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
             <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-full transition-all duration-300 font-bold uppercase tracking-wider shadow-sm hover:translate-y-[-2px] active:translate-y-0"
            >
              <Upload className="w-5 h-5" />
              <span>导入地图</span>
            </button>
            <button 
              onClick={() => copyToClipboard(mapData.join('\n'))}
              className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-full transition-all duration-300 font-bold uppercase tracking-wider shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.2)] active:translate-y-0 active:shadow-none"
            >
              <ClipboardType className="w-5 h-5" />
              <span>复制全图</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Size Control */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200">
            <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider mb-2 block">地图尺寸 (最大 {MAX_SIZE})</label>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                 <input 
                  type="number" min="1" max={MAX_SIZE}
                  value={rows}
                  onChange={(e) => updateSize(parseInt(e.target.value) || 1, cols)}
                  className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-xl px-4 py-3 font-mono text-lg font-bold text-zinc-700 focus:outline-none focus:border-sky-400 focus:ring-0 transition-colors text-center"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">高</span>
              </div>
              <span className="text-zinc-300 font-black text-xl">×</span>
              <div className="relative flex-1">
                <input 
                  type="number" min="1" max={MAX_SIZE}
                  value={cols}
                  onChange={(e) => updateSize(rows, parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-xl px-4 py-3 font-mono text-lg font-bold text-zinc-700 focus:outline-none focus:border-sky-400 focus:ring-0 transition-colors text-center"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">宽</span>
              </div>
            </div>
          </div>
          
          {/* Font Control */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200">
             <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3" /> 字体选择
                </label>
                <a 
                  href="https://gitgud.io/era-games-zh/meta/eraFonts" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:text-sky-400 hover:underline"
                >
                  <Download className="w-3 h-3" /> 下载字体
                </a>
             </div>
             <select 
               value={fontFamily}
               onChange={(e) => setFontFamily(e.target.value)}
               className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-700 focus:outline-none focus:border-sky-400 focus:ring-0 transition-colors appearance-none"
             >
               <option value="'MS Gothic', monospace">MS Gothic (era默认)</option>
               <option 
                 value="'ERA MONO SC'" 
                 disabled={!fontsAvailable["'ERA MONO SC'"]}
                 className={!fontsAvailable["'ERA MONO SC'"] ? "text-gray-400 bg-gray-100" : ""}
                 style={{ color: !fontsAvailable["'ERA MONO SC'"] ? '#a1a1aa' : 'inherit' }}
               >
                 ERA MONO SC {fontsAvailable["'ERA MONO SC'"] ? '' : '(未安装)'}
               </option>
               <option 
                 value="'EraPixel'" 
                 disabled={!fontsAvailable["'EraPixel'"]}
                 className={!fontsAvailable["'EraPixel'"] ? "text-gray-400 bg-gray-100" : ""}
                 style={{ color: !fontsAvailable["'EraPixel'"] ? '#a1a1aa' : 'inherit' }}
               >
                 EraPixel {fontsAvailable["'EraPixel'"] ? '' : '(未安装)'}
               </option>
             </select>
          </div>
        </div>

        {/* MONITOR CHASSIS */}
        <div className="bg-[#2a2a2e] p-4 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.1)] border-b-[8px] border-zinc-800">
          
          {/* SCREEN BEZEL */}
          <div className="bg-[#09090b] rounded-xl p-4 md:p-6 overflow-x-auto relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-[6px] border-[#1a1a1c] min-h-[500px]">
            
            {/* Screen Glare (Subtle) */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none z-10"></div>

             {/* Container for the grid - inline-block ensures it expands as needed */}
             <div className="flex flex-col gap-0 min-w-max relative z-0 pb-4 pr-4">
               {mapData.map((row, idx) => (
                 <div key={idx} className="flex items-center group relative" style={{ height: '1.5em' }}>
                   {/* Row Number */}
                   <div className="absolute -left-8 top-0 h-full flex items-center w-6 justify-end text-[12px] text-zinc-700 font-mono select-none">
                      {idx + 1}
                   </div>
                   
                   <input 
                     type="text"
                     value={row}
                     onChange={(e) => handleRowChange(idx, e.target.value)}
                     style={{ 
                       fontFamily: fontFamily, 
                       // Generous width calculation: cols * 1.1em to accommodate full-width chars + ample buffer for padding
                       width: `calc(${cols * 1.1}em + 4rem)`, 
                       height: '1.5em',
                       lineHeight: '1.5',
                       fontSize: '1.5rem',
                       letterSpacing: '0px'
                     }} 
                     className="
                       block 
                       bg-transparent 
                       text-zinc-100 
                       border-none 
                       outline-none 
                       p-0 m-0 
                       cursor-text 
                       selection:bg-amber-500/50
                     "
                     spellCheck={false}
                   />
                   
                   <button 
                     onClick={() => copyToClipboard(row, idx)}
                     className={`
                       ml-2 p-1.5 rounded-md transition-all duration-200 origin-left flex items-center justify-center scale-75 md:scale-100
                       ${copiedRowIndex === idx 
                          ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(74,222,128,0.5)]' 
                          : 'bg-zinc-800 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-sky-500 hover:text-white'}
                     `}
                     title="复制此行"
                   >
                     <Copy className="w-4 h-4" />
                   </button>
                 </div>
               ))}
             </div>
          </div>
          
          {/* Monitor Label */}
          <div className="flex justify-center mt-3">
             <div className="text-[10px] font-mono text-zinc-500 tracking-[0.5em] uppercase">ERA终端 2000型</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Palette */}
      <div className="w-full xl:w-96 bg-white rounded-[2rem] p-6 shadow-xl border-2 border-white sticky top-6 z-20">
        <div className="bg-sky-50 rounded-2xl p-4 mb-6 border border-sky-100">
          <div className="flex items-center gap-2 text-sky-600 mb-1">
            <Grid3X3 className="w-5 h-5" />
            <h2 className="font-black uppercase tracking-wider text-sm">字符工具箱</h2>
          </div>
          <p className="text-xs text-sky-800/60 font-medium">点击任意字符即可复制到剪贴板。</p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 pl-1">常用符号</h3>
            <div className="grid grid-cols-6 gap-2">
              {specialChars.split(' ').map((char, i) => (
                <button
                  key={i}
                  onClick={() => copySymbol(char)}
                  className="aspect-square flex items-center justify-center bg-zinc-50 border-2 border-zinc-100 rounded-xl hover:bg-amber-400 hover:border-amber-400 hover:text-white transition-all text-base font-bold shadow-sm active:scale-95"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 pl-1">制表符</h3>
            <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              {boxDrawingRows.map((rowStr, rowIdx) => (
                <div key={rowIdx} className="flex gap-1 justify-between">
                  {rowStr.split('').map((char, charIdx) => (
                    <button
                      key={`${rowIdx}-${charIdx}`}
                      onClick={() => copySymbol(char)}
                      className="w-full aspect-square flex items-center justify-center bg-white border border-zinc-200 rounded-lg hover:bg-sky-500 hover:border-sky-500 hover:text-white transition-all text-lg font-mono leading-none shadow-sm active:scale-90"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl border-4 border-white relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-red-100 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h3 className="text-2xl font-black text-zinc-800 uppercase tracking-tight">导入地图数据</h3>
              <p className="text-zinc-500 text-sm mt-1">
                将文本粘贴到下方。系统将自动调整地图尺寸（最大 {MAX_SIZE}x{MAX_SIZE}）。
              </p>
            </div>
            
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full h-64 bg-zinc-50 rounded-xl p-4 font-mono text-sm border-2 border-zinc-200 focus:border-amber-400 outline-none resize-none mb-6 leading-relaxed"
              placeholder="在此粘贴文本地图..."
            />
            
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="px-6 py-3 rounded-full font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold uppercase tracking-wider shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default TextMapEditor;