import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MousePointer2, Calculator, Clock, Database, Sparkles, ExternalLink, FileDiff, Map, Search, Image as ImageIcon, ArrowRight, Code } from 'lucide-react';
import { Tool } from '../types';

// Internal Tools
const internalTools: Tool[] = [
  {
    id: 'counter',
    name: '手动计数器',
    description: '精密增量统计设备。',
    path: '/counter',
    icon: MousePointer2,
    status: 'active'
  },
  {
    id: 'anime-namer',
    name: '二次元起名器',
    description: '二次元味儿超冲随机起名。',
    path: '/anime-namer',
    icon: Sparkles,
    status: 'active'
  },
  {
    id: 'text-map',
    name: '文字地图编辑器',
    description: '基于字符的复古地图绘制系统。',
    path: '/text-map',
    icon: Map,
    status: 'active'
  },
  {
    id: 'calc',
    name: '计算模组',
    description: '基础算术运算单元。',
    path: '/calc',
    icon: Calculator,
    status: 'coming_soon'
  },
  {
    id: 'timer',
    name: '计时单元',
    description: '时间测量系统。',
    path: '/timer',
    icon: Clock,
    status: 'coming_soon'
  },
  {
    id: 'notes',
    name: '数据日志',
    description: '个人思维存储库。',
    path: '/notes',
    icon: Database,
    status: 'coming_soon'
  }
];

// External Tools
const externalTools: Tool[] = [
  {
    id: 'diff-checker',
    name: '文本差异对比',
    description: 'diffchecker.com',
    path: 'https://www.diffchecker.com/zh-Hans/',
    icon: FileDiff,
    status: 'active',
    isExternal: true
  },
  {
    id: 'sauce-nao',
    name: '以图搜图',
    description: 'saucenao.com',
    path: 'https://saucenao.com/',
    icon: ImageIcon,
    status: 'active',
    isExternal: true
  },
  {
    id: 'regex-online',
    name: '正则表达式在线',
    description: 'jyshare.com',
    path: 'https://www.jyshare.com/front-end/854/',
    icon: Code,
    status: 'active',
    isExternal: true
  }
];

const ToolCard: React.FC<{ tool: Tool, variant: 'internal' | 'external' }> = ({ tool, variant }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (tool.status !== 'active') return;
    
    if (tool.isExternal) {
      window.open(tool.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(tool.path);
    }
  };

  const isActive = tool.status === 'active';

  // Styles for "Internal" Tools - Sleek, White, Chrome, Streamlined
  const internalStyles = `
    bg-gradient-to-br from-white to-[#f2f2f0]
    border-[3px] border-white
    shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05),inset_0_-2px_4px_rgba(0,0,0,0.05)]
    hover:translate-y-[-4px] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]
    text-zinc-800
  `;

  // Styles for "External" Tools - More industrial, distinct
  const externalStyles = `
    bg-gradient-to-br from-slate-100 to-slate-200
    border-[3px] border-slate-50
    shadow-[4px_4px_0px_rgba(100,116,139,0.2)]
    hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(100,116,139,0.2)]
    text-slate-700
  `;

  const disabledStyles = `
    bg-zinc-100 border-2 border-dashed border-zinc-300 opacity-60 cursor-not-allowed
  `;

  return (
    <button
      onClick={handleClick}
      disabled={!isActive}
      className={`
        relative group overflow-hidden rounded-[2rem] p-6 text-left transition-all duration-300 w-full flex flex-col h-full min-h-[180px]
        ${isActive ? (variant === 'internal' ? internalStyles : externalStyles) : disabledStyles}
      `}
    >
      {/* Decorative Shine for Internal */}
      {variant === 'internal' && isActive && (
         <div className="absolute top-0 right-0 w-[150%] h-full bg-gradient-to-l from-white/60 to-transparent skew-x-12 translate-x-full group-hover:translate-x-[-20%] transition-transform duration-700 pointer-events-none"></div>
      )}

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className={`
            p-3.5 rounded-2xl transition-all duration-300
            ${isActive 
              ? (variant === 'internal' 
                  ? 'bg-amber-100 text-amber-600 shadow-inner group-hover:bg-amber-400 group-hover:text-white' 
                  : 'bg-white text-sky-600 shadow-sm group-hover:text-sky-700')
              : 'bg-zinc-200 text-zinc-400'}
          `}>
            <tool.icon className="w-8 h-8" strokeWidth={2} />
          </div>
          
          {isActive && (
            <div className="bg-white/50 backdrop-blur rounded-full p-1.5 border border-white/50">
               {tool.isExternal ? <ExternalLink className="w-4 h-4 text-slate-400" /> : <ArrowRight className="w-4 h-4 text-amber-400 -rotate-45 group-hover:rotate-0 transition-transform" />}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-black text-zinc-800 tracking-tight leading-none mb-2">
            {tool.name}
          </h3>
          <p className="text-sm font-medium leading-relaxed opacity-70">
            {tool.description}
          </p>
        </div>
      </div>
      
      {/* Bottom accent bar */}
      {isActive && (
        <div className={`absolute bottom-0 left-0 w-full h-1.5 ${variant === 'internal' ? 'bg-amber-400' : 'bg-sky-400'} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
      )}
    </button>
  );
};

const Dashboard: React.FC = () => {
  const activeInternalTools = internalTools.filter(t => t.status === 'active');
  const activeExternalTools = externalTools.filter(t => t.status === 'active');

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      
      {/* Internal Tools Section */}
      <section>
        <div className="flex items-center gap-4 mb-6 border-b-2 border-zinc-300 pb-4">
          <h2 className="text-2xl font-black text-zinc-800 tracking-tight">
            核心工具
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {activeInternalTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} variant="internal" />
          ))}
        </div>
      </section>

      {/* External Tools Section */}
      <section>
        <div className="flex items-center gap-4 mb-6 border-b-2 border-zinc-300 pb-4">
          <h2 className="text-2xl font-black text-zinc-800 tracking-tight">
            外部工具
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {activeExternalTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} variant="external" />
          ))}
        </div>
      </section>

    </div>
  );
};

export default Dashboard;