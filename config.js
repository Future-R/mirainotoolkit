// 配置文件
// 修改这里的 JSON 内容即可配置工具箱
// 这是一个 JS 文件，为了能在本地直接运行 (file:// 协议)，我们不能使用 .json 文件

window.TOOLBOX_CONFIG = {
  "name": "未来工具箱",
  "description": "各种小工具。",
  "tools": [
    {
      "id": "counter",
      "name": "手动计数器",
      "desc": "可能是打击感最强的计数器",
      "path": "counter",
      "icon": "mouse-pointer-2",
      "type": "internal",
      "labelClass": "bg-[#F06E1E]",
      "iconColor": "text-white"
    },
    {
      "id": "anime-namer",
      "name": "二次元起名器",
      "desc": "味儿超冲",
      "path": "anime-namer",
      "icon": "sparkles",
      "type": "internal",
      "labelClass": "bg-[#e03c8a]",
      "iconColor": "text-white"
    },
    {
      "id": "dice",
      "name": "电子骰子",
      "desc": "概率不过是信念的强度",
      "path": "dice",
      "icon": "box",
      "type": "internal",
      "labelClass": "bg-[#6366F1]",
      "iconColor": "text-white"
    },
    {
      "id": "text-map",
      "name": "文字地图编辑器",
      "desc": "如果你不知道有什么用，那它就没用",
      "path": "text-map",
      "icon": "map",
      "type": "internal",
      "labelClass": "bg-[#5f27cd]",
      "iconColor": "text-white"
    },
    {
      "id": "diff-checker",
      "name": "文本差异对比",
      "desc": "Diff Checker",
      "path": "https://www.diffchecker.com/zh-Hans/",
      "icon": "file-diff",
      "type": "external",
      "labelClass": "bg-[#00C281]",
      "iconColor": "text-white"
    },
    {
      "id": "sauce-nao",
      "name": "以图搜图",
      "desc": "SauceNAO",
      "path": "https://saucenao.com/",
      "icon": "image",
      "type": "external",
      "labelClass": "bg-[#383838]",
      "iconColor": "text-white"
    },
    {
      "id": "regex-online",
      "name": "正则表达式",
      "desc": "Regex Online",
      "path": "https://www.jyshare.com/front-end/854/",
      "icon": "code",
      "type": "external",
      "labelClass": "bg-[#4B5168]",
      "iconColor": "text-white"
    },
    {
      "id": "msd-manual",
      "name": "诊疗手册",
      "desc": "治出问题别找我",
      "path": "https://www.msdmanuals.cn/home/symptoms",
      "icon": "stethoscope",
      "type": "external",
      "labelClass": "bg-[#B12E32]",
      "iconColor": "text-white"
    },
    {
      "id": "guji-search",
      "name": "古籍搜索",
      "desc": "识典古籍",
      "path": "https://www.shidianguji.com/",
      "icon": "scroll",
      "type": "external",
      "labelClass": "bg-[#e79460]",
      "iconColor": "text-zinc-800"
    }
  ]
};