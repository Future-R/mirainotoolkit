window.App = window.App || {};
window.App.pages = window.App.pages || {};
window.App.textMap = window.App.textMap || {};

window.App.textMap.DEFAULT_CONFIG = {
    rows: 32,
    cols: 32,
    font: "'MS Gothic', monospace",
    maxSize: 64
};

window.App.textMap.TOOLBOX_CHARS = [
    '┌', '┬', '┐', '┏', '┳', '┓', '╔', '╦', '╗', '╭', '─', '╮',
    '├', '┼', '┤', '┣', '╋', '┫', '╠', '╬', '╣', '│', '╳', '┃',
    '└', '┴', '┘', '┗', '┻', '┛', '╚', '╩', '╝', '╰', '━', '╯',
    '┍', '┑', '┎', '┒', '╒', '╕', '╓', '╖', '／', '＼', '┄', '┅',
    '┕', '┙', '┖', '┚', '╘', '╛', '╙', '╜', '＜', '＞', '┆', '┇',
    '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '♨', '✟',
    '※', '◎', '□', '■', '♠', '♥', '♦', '♣', '↑', '↓', '←', '→',
    '○', '●', 'Ｏ', 'Ｘ', '＠', '　', '△', '▽', '◇', '▲', '▼', '◆',
    '〓', '∞', '～', '┄', '┅', '┆', '┇', '≈', '⊙', '░', '▒', '▓'
];

window.App.textMap.LOCALES = {
    'zh-CN': {
        title: '文字地图编辑器',
        subtitle: '你也可以用来拼豆',
        import: '导入',
        undo: '撤销',
        redo: '重做',
        exportErb: '导出 ERB',
        copyAll: '复制全图',
        rows: '行',
        cols: '列',
        font: '字体',
        cursor: '光标',
        mapSettings: '地图参数',
        width: '宽度',
        height: '高度',
        fontSelect: '字体选择',
        fontDefault: '默认',
        installRequired: '需安装',
        installRequiredMarker: '需安装',
        downloadFonts: '下载字体资源 >',
        textStyle: '文本样式',
        foreground: '前景色',
        selectedChar: '选中字符',
        bold: '加粗',
        underline: '下划线',
        strike: '删除线',
        charToolbox: '字符工具箱',
        keyboard: '键盘',
        unselected: '未选中',
        modeText: '文本编辑',
        modeRect: '矩形填充',
        tipText: '整行原生框选、复制、删除与富文本样式修改；点击下方字符会直接复制。',
        tipRectSelected: '当前填充字符：{char}。拖拽左侧字符位即可按当前文本样式进行矩形填充。',
        tipRectIdle: '矩形填充模式下，请先从字符工具箱选择一个字符，再到左侧拖拽填充。',
        importMapText: '导入地图文本 / ERB',
        importPlaceholder: '在此处粘贴纯文本，或粘贴当前工具导出的 ERB...',
        importInvalidErb: '未能识别为当前工具可导入的 ERB。',
        cancel: '取消',
        confirmImport: '确认导入',
        copyRowTitle: '复制第 {row} 行',
        erbHeader: '; 未来工具箱 之 文字地图编辑器 于 {timestamp} 生成',
        copied: '已复制',
        exported: '已导出'
    },
    'ja-JP': {
        title: 'テキストマップエディタ',
        subtitle: 'ピクセル画を描くのにも使える',
        import: 'インポート',
        undo: '元に戻す',
        redo: 'やり直す',
        exportErb: 'ERB を書き出す',
        copyAll: 'マップ全体をコピー',
        rows: '行',
        cols: '列',
        font: 'フォント',
        cursor: 'カーソル',
        mapSettings: 'マップ設定',
        width: '幅',
        height: '高さ',
        fontSelect: 'フォント選択',
        fontDefault: '標準',
        installRequired: '要インストール',
        installRequiredMarker: '要インストール',
        downloadFonts: 'フォント素材をダウンロード >',
        textStyle: 'テキストスタイル',
        foreground: '文字色',
        selectedChar: '選択文字',
        bold: '太字',
        underline: '下線',
        strike: '取り消し線',
        charToolbox: '文字ツールボックス',
        keyboard: 'キーボード',
        unselected: '未選択',
        modeText: 'テキスト編集',
        modeRect: '矩形塗りつぶし',
        tipText: 'テキスト編集モードでは、1 行単位のネイティブ選択、コピー、削除、リッチテキスト装飾の編集に対応し、下の文字クリックはコピーになります。',
        tipRectSelected: '現在の塗りつぶし文字: {char}。左側の文字マスをドラッグすると、現在のテキストスタイルで矩形塗りつぶしできます。',
        tipRectIdle: '矩形塗りつぶしモードでは、先に文字ツールボックスから文字を選び、そのあと左側をドラッグして塗りつぶしてください。',
        importMapText: 'マップテキスト / ERB をインポート',
        importPlaceholder: 'ここにプレーンテキスト、またはこのツールが書き出した ERB を貼り付けてください...',
        importInvalidErb: 'このツールで再読込できる ERB として認識できませんでした。',
        cancel: 'キャンセル',
        confirmImport: 'インポートする',
        copyRowTitle: '{row} 行目をコピー',
        erbHeader: '; Mirai Toolkit テキストマップエディタで {timestamp} に生成',
        copied: 'コピー済み',
        exported: '書き出し済み'
    }
};

window.App.textMap.getLocale = () => {
    if (window.App && typeof window.App.getLocale === 'function') {
        return window.App.getLocale();
    }

    const locale = String(document.documentElement.lang || navigator.language || 'zh-CN').toLowerCase();
    return locale.startsWith('ja') ? 'ja-JP' : 'zh-CN';
};

window.App.textMap.getStrings = () => (
    window.App.textMap.LOCALES[window.App.textMap.getLocale()] || window.App.textMap.LOCALES['zh-CN']
);

window.App.textMap.formatString = (template, params = {}) => (
    String(template || '').replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '')
);
