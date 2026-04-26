(function() {
    const ns = window.App.textMap;
    if (!ns) return;

    const BLANK_CELL = 'Ｘ';
    const DEFAULT_COLOR = '#ffffff';
    const colorParser = document.createElement('span');

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const escapeHtml = (value = '') => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const normalizeSelectedChar = (value) => {
        const chars = Array.from(String(value ?? '').replace(/\r?\n/g, '').replace(/\u200b/g, ''));
        return chars.length > 0 ? chars[0] : '';
    };

    const normalizeChar = (value) => normalizeSelectedChar(value) || BLANK_CELL;

    const normalizeColor = (value, fallback = DEFAULT_COLOR) => {
        if (!value) return fallback;

        if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();

        colorParser.style.color = '';
        colorParser.style.color = value;
        const normalized = colorParser.style.color;
        const rgbMatch = normalized.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);

        if (!rgbMatch) return fallback;

        return `#${[rgbMatch[1], rgbMatch[2], rgbMatch[3]]
            .map((part) => Number(part).toString(16).padStart(2, '0'))
            .join('')}`;
    };

    const getReadableTextColor = (hexColor) => {
        const color = normalizeColor(hexColor).slice(1);
        const red = parseInt(color.slice(0, 2), 16);
        const green = parseInt(color.slice(2, 4), 16);
        const blue = parseInt(color.slice(4, 6), 16);
        const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
        return brightness >= 160 ? '#18181b' : '#ffffff';
    };

    const createCell = (char = BLANK_CELL, style = {}) => ({
        char: normalizeChar(char),
        color: normalizeColor(style.color),
        bold: Boolean(style.bold),
        underline: Boolean(style.underline),
        strike: Boolean(style.strike)
    });

    const cloneCell = (cell) => createCell(cell?.char, cell || {});

    const ensureRowLength = (cells = [], cols = ns.DEFAULT_CONFIG.maxSize) => {
        const normalized = Array.from({ length: cols }, (_, index) => (
            cells[index] ? cloneCell(cells[index]) : createCell()
        ));
        return normalized.slice(0, cols);
    };

    const createEmptyMap = (rows, cols) => (
        Array.from({ length: rows }, () => Array.from({ length: cols }, () => createCell()))
    );

    const cloneMapData = (source = []) => source.map((row) => row.map((cell) => cloneCell(cell)));

    const isSameCell = (left, right) => (
        left.char === right.char &&
        left.color === right.color &&
        left.bold === right.bold &&
        left.underline === right.underline &&
        left.strike === right.strike
    );

    const isSameStyle = (left, right) => (
        left.color === right.color &&
        left.bold === right.bold &&
        left.underline === right.underline &&
        left.strike === right.strike
    );

    const getPlainTextRow = (mapData, rowIndex) => (mapData[rowIndex] || []).map((cell) => cell.char).join('');
    const getPlainTextMap = (mapData) => (mapData || []).map((_, rowIndex) => getPlainTextRow(mapData, rowIndex)).join('\n');

    const isFullWidthCodePoint = (codePoint) => (
        codePoint >= 0x1100 && (
            codePoint <= 0x115f ||
            codePoint === 0x2329 ||
            codePoint === 0x232a ||
            (codePoint >= 0x2190 && codePoint <= 0x21ff) ||
            (codePoint >= 0x2460 && codePoint <= 0x24ff) ||
            (codePoint >= 0x2500 && codePoint <= 0x257f) ||
            (codePoint >= 0x2580 && codePoint <= 0x259f) ||
            (codePoint >= 0x25a0 && codePoint <= 0x25ff) ||
            (codePoint >= 0x2600 && codePoint <= 0x26ff) ||
            (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
            (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
            (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
            (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
            (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
            (codePoint >= 0xff01 && codePoint <= 0xff60) ||
            (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
            (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
            (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
            (codePoint >= 0x20000 && codePoint <= 0x3fffd)
        )
    );

    const getCharDisplayUnits = (char) => {
        const codePoint = Array.from(String(char || BLANK_CELL))[0]?.codePointAt(0) || BLANK_CELL.codePointAt(0);
        return isFullWidthCodePoint(codePoint) ? 2 : 1;
    };

    const buildRunMarkup = (text, style, options = {}) => {
        const styles = [
            `color:${style.color}`,
            `font-weight:${style.bold ? '700' : '400'}`,
            `text-decoration:${[
                style.underline ? 'underline' : '',
                style.strike ? 'line-through' : ''
            ].filter(Boolean).join(' ') || 'none'}`
        ].join(';');

        const content = options.preserveSpaces
            ? escapeHtml(text).replace(/ /g, '&nbsp;')
            : escapeHtml(text);

        return `<span style="${styles}">${content}</span>`;
    };

    const buildRichRowHtml = (rowCells, options = {}) => {
        const runs = [];

        rowCells.forEach((cell) => {
            const style = {
                color: normalizeColor(cell.color),
                bold: Boolean(cell.bold),
                underline: Boolean(cell.underline),
                strike: Boolean(cell.strike)
            };
            const lastRun = runs[runs.length - 1];

            if (lastRun && isSameStyle(lastRun.style, style)) {
                lastRun.text += cell.char;
            } else {
                runs.push({ text: cell.char, style });
            }
        });

        return runs.map((run) => buildRunMarkup(run.text, run.style, options)).join('');
    };

    const buildRichClipboardPayloadFromCells = (cells) => ({
        text: cells.map((cell) => cell.char).join(''),
        html: buildRichRowHtml(cells, { preserveSpaces: true })
    });

    const parseStyledCellsFromDom = (rootNode, options = {}) => {
        const maxCells = options.maxCells ?? ns.DEFAULT_CONFIG.maxSize;
        const defaultColor = options.defaultColor || DEFAULT_COLOR;
        const cells = [];
        const walk = (node, inheritedStyle) => {
            if (cells.length >= maxCells) return;

            if (node.nodeType === Node.TEXT_NODE) {
                Array.from((node.nodeValue || '').replace(/\r?\n/g, '').replace(/\u200b/g, '').replace(/\u00a0/g, ' ')).forEach((char) => {
                    if (cells.length < maxCells) cells.push(createCell(char, inheritedStyle));
                });
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return;

            const element = node;
            const tag = element.tagName.toLowerCase();
            if (tag === 'br') return;
            const nextStyle = {
                color: inheritedStyle.color,
                bold: inheritedStyle.bold,
                underline: inheritedStyle.underline,
                strike: inheritedStyle.strike
            };

            if (tag === 'b' || tag === 'strong') nextStyle.bold = true;
            if (tag === 'u') nextStyle.underline = true;
            if (tag === 's' || tag === 'strike' || tag === 'del') nextStyle.strike = true;

            const attrColor = element.getAttribute('color');
            const inlineColor = element.style.color;
            if (attrColor) nextStyle.color = normalizeColor(attrColor, defaultColor);
            if (inlineColor) nextStyle.color = normalizeColor(inlineColor, defaultColor);

            const inlineWeight = element.style.fontWeight;
            if (inlineWeight && (inlineWeight === 'bold' || parseInt(inlineWeight, 10) >= 600)) nextStyle.bold = true;

            const inlineDecoration = `${element.style.textDecoration || ''} ${element.style.textDecorationLine || ''}`;
            if (inlineDecoration.includes('underline')) nextStyle.underline = true;
            if (inlineDecoration.includes('line-through')) nextStyle.strike = true;

            Array.from(element.childNodes).forEach((child) => walk(child, nextStyle));
        };

        walk(rootNode, { color: defaultColor, bold: false, underline: false, strike: false });
        return cells;
    };

    const parseStyledCellsFromHtml = (html, options = {}) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        return parseStyledCellsFromDom(wrapper, options);
    };

    const buildSanitizedClipboardHtml = (html, options = {}) => {
        const cells = parseStyledCellsFromHtml(html, options);
        return cells.length > 0 ? buildRichRowHtml(cells) : '';
    };

    const buildErbLine = (rowCells, options = {}) => {
        const defaultColor = options.defaultColor || DEFAULT_COLOR;
        const runs = [];

        rowCells.forEach((cell) => {
            const style = {
                color: normalizeColor(cell.color, defaultColor),
                bold: Boolean(cell.bold),
                underline: Boolean(cell.underline),
                strike: Boolean(cell.strike)
            };
            const lastRun = runs[runs.length - 1];

            if (lastRun && isSameStyle(lastRun.style, style)) {
                lastRun.text += cell.char;
            } else {
                runs.push({ text: cell.char, style });
            }
        });

        const html = runs.map((run) => {
            let segment = escapeHtml(run.text).replace(/ /g, '&nbsp;');

            if (run.style.color !== defaultColor) segment = `<font color='${run.style.color}'>${segment}</font>`;
            if (run.style.bold) segment = `<b>${segment}</b>`;
            if (run.style.underline) segment = `<u>${segment}</u>`;
            if (run.style.strike) segment = `<s>${segment}</s>`;

            return segment;
        }).join('');

        return `<nobr>${html}</nobr>`;
    };

    const buildErbScript = (mapData, options = {}) => {
        const defaultColor = options.defaultColor || DEFAULT_COLOR;
        const formatString = options.formatString || ((template, params = {}) => String(template || '').replace(/\{(\w+)\}/g, (_, key) => params[key] ?? ''));
        const headerTemplate = options.headerTemplate || '; Text Map Editor generated at {timestamp}';
        const now = options.timestamp instanceof Date ? options.timestamp : new Date();
        const timestamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('-');

        const erbLines = [
            formatString(headerTemplate, { timestamp }),
            '#DIMS DYNAMIC htmlString',
            'htmlString \'= ""'
        ];

        (mapData || []).forEach((rowCells, rowIndex) => {
            erbLines.push(`htmlString += "${buildErbLine(rowCells, { defaultColor })}"`);
            if (rowIndex < mapData.length - 1) {
                erbLines.push('htmlString += "<br>"');
            }
        });

        erbLines.push('HTML_PRINT htmlString');
        return erbLines.join('\n');
    };

    const extractErbHtmlPayload = (erbText) => {
        const text = String(erbText || '').replace(/\r/g, '');
        const segments = [];

        text.split('\n').forEach((line) => {
            const match = line.match(/^\s*htmlString\s*\+=\s*"([\s\S]*)"\s*$/);
            if (match) segments.push(match[1]);
        });

        if (segments.length === 0) return null;
        return segments.join('');
    };

    const parseErbScript = (erbText, options = {}) => {
        const maxSize = options.maxSize ?? ns.DEFAULT_CONFIG.maxSize;
        const defaultColor = options.defaultColor || DEFAULT_COLOR;
        const htmlPayload = extractErbHtmlPayload(erbText);
        if (htmlPayload == null) return null;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlPayload;

        const rowNodes = [];
        let currentRow = document.createElement('div');
        const pushRow = () => {
            rowNodes.push(currentRow);
            currentRow = document.createElement('div');
        };

        Array.from(wrapper.childNodes).forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE && !String(child.nodeValue || '').trim()) {
                return;
            }

            if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'br') {
                pushRow();
                return;
            }

            currentRow.appendChild(child.cloneNode(true));
        });

        if (currentRow.childNodes.length > 0 || rowNodes.length === 0) {
            rowNodes.push(currentRow);
        }

        const rawRows = rowNodes
            .slice(0, maxSize)
            .map((rowNode) => parseStyledCellsFromDom(rowNode, { maxCells: maxSize, defaultColor }));

        const nextRows = clamp(rawRows.length || 1, 1, maxSize);
        const nextCols = clamp(
            rawRows.reduce((maxLength, row) => Math.max(maxLength, row.length), 1),
            1,
            maxSize
        );

        const mapData = createEmptyMap(nextRows, nextCols);
        for (let rowIndex = 0; rowIndex < nextRows; rowIndex += 1) {
            mapData[rowIndex] = ensureRowLength(rawRows[rowIndex] || [], nextCols);
        }

        return {
            rows: nextRows,
            cols: nextCols,
            mapData
        };
    };

    ns.model = {
        BLANK_CELL,
        DEFAULT_COLOR,
        clamp,
        escapeHtml,
        normalizeSelectedChar,
        normalizeChar,
        normalizeColor,
        getReadableTextColor,
        createCell,
        cloneCell,
        ensureRowLength,
        createEmptyMap,
        cloneMapData,
        isSameCell,
        isSameStyle,
        getPlainTextRow,
        getPlainTextMap,
        getCharDisplayUnits,
        buildRichRowHtml,
        buildRichClipboardPayloadFromCells,
        parseStyledCellsFromDom,
        parseStyledCellsFromHtml,
        buildSanitizedClipboardHtml,
        buildErbScript,
        extractErbHtmlPayload,
        parseErbScript
    };
})();
