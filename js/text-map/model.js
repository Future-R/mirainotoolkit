(function() {
    const ns = window.App.textMap;
    if (!ns) return;

    const BLANK_CELL = 'Ｘ';
    const DEFAULT_COLOR = '#ffffff';
    const HALF_WIDTH_POOL = " ~`1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()[]{}-_=+.,;:№\\/|<>'\"｡･｢｣ﾄﾐｴｮﾖﾛ☺☻ﾞﾘﾉ╔╦╗╠╬╣╚╩╝═║⊙░▒▓┄┅┆┇";
    const HALF_WIDTH_SET = new Set(Array.from(HALF_WIDTH_POOL));
    const SLOT_CONTINUATION = Symbol('text-map-slot-continuation');
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

    const isHalfWidthChar = (char) => {
        const normalizedChar = normalizeSelectedChar(char);
        if (!normalizedChar) return false;
        if (HALF_WIDTH_SET.has(normalizedChar)) return true;

        const codePoint = normalizedChar.codePointAt(0);
        if (codePoint == null) return false;
        if (codePoint <= 0x7f) return true;
        return !isFullWidthCodePoint(codePoint);
    };

    const getCharWidth = (char) => (isHalfWidthChar(char) ? 1 : 2);
    const getCharDisplayUnits = getCharWidth;

    const createCell = (char = BLANK_CELL, style = {}) => {
        const normalizedChar = normalizeChar(char);
        const width = style.width === 1 || style.width === 2 ? style.width : getCharWidth(normalizedChar);
        return {
            char: normalizedChar,
            width,
            color: normalizeColor(style.color),
            bold: Boolean(style.bold),
            underline: Boolean(style.underline),
            strike: Boolean(style.strike)
        };
    };

    const cloneCell = (cell) => createCell(cell?.char, cell || {});
    const getCellWidth = (cell) => {
        if (!cell) return 1;
        return cell.width === 1 || cell.width === 2 ? cell.width : getCharWidth(cell.char);
    };

    const createBlankCell = () => createCell(BLANK_CELL);
    const createHalfSpaceCell = () => createCell(' ');

    const measureRowSlots = (cells = []) => cells.reduce((total, cell) => total + getCellWidth(cell), 0);

    const rowToSlotArray = (rowCells = [], slotCols = ns.DEFAULT_CONFIG.maxSize * 2) => {
        const slots = Array.from({ length: slotCols }, () => null);
        let slotIndex = 0;

        for (const cell of rowCells) {
            const nextCell = cloneCell(cell);
            const width = getCellWidth(nextCell);
            nextCell.width = width;
            if (slotIndex + width > slotCols) break;

            slots[slotIndex] = nextCell;
            if (width === 2 && slotIndex + 1 < slotCols) slots[slotIndex + 1] = SLOT_CONTINUATION;
            slotIndex += width;
        }

        return slots;
    };

    const slotArrayToRow = (slots = [], slotCols = slots.length) => {
        const rowCells = [];
        for (let slotIndex = 0; slotIndex < slotCols; slotIndex += 1) {
            const slot = slots[slotIndex];
            if (slot === SLOT_CONTINUATION) {
                rowCells.push(createHalfSpaceCell());
                continue;
            }
            if (!slot) {
                rowCells.push(createHalfSpaceCell());
                continue;
            }

            const width = getCellWidth(slot);
            rowCells.push(createCell(slot.char, slot));
            if (width === 2) {
                slotIndex += 1;
            }
        }
        return rowCells;
    };

    const normalizeRow = (cells = [], slotCols = ns.DEFAULT_CONFIG.maxSize * 2) => {
        const sanitized = [];
        let usedSlots = 0;

        for (const cell of cells) {
            const nextCell = cloneCell(cell);
            const width = getCellWidth(nextCell);
            nextCell.width = width;
            if (usedSlots + width > slotCols) break;
            sanitized.push(nextCell);
            usedSlots += width;
        }

        while (usedSlots < slotCols) {
            if (slotCols - usedSlots >= 2) {
                sanitized.push(createBlankCell());
                usedSlots += 2;
            } else {
                sanitized.push(createHalfSpaceCell());
                usedSlots += 1;
            }
        }

        return sanitized;
    };

    const truncateRowToSlots = (cells = [], slotCols = ns.DEFAULT_CONFIG.maxSize * 2) => {
        const sanitized = [];
        let usedSlots = 0;

        for (const cell of cells) {
            const nextCell = cloneCell(cell);
            const width = getCellWidth(nextCell);
            nextCell.width = width;
            if (usedSlots + width > slotCols) break;
            sanitized.push(nextCell);
            usedSlots += width;
        }

        return sanitized;
    };

    const createEmptyRow = (slotCols = ns.DEFAULT_CONFIG.cols * 2) => normalizeRow([], slotCols);
    const createEmptyMap = (rows, slotCols) => (
        Array.from({ length: rows }, () => createEmptyRow(slotCols))
    );

    const cloneMapData = (source = []) => source.map((row) => row.map((cell) => cloneCell(cell)));

    const isSameCell = (left, right) => (
        left.char === right.char &&
        getCellWidth(left) === getCellWidth(right) &&
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

    const buildRowMetrics = (rowCells = [], slotCols = measureRowSlots(rowCells)) => {
        const charToSlot = [0];
        const slotToChar = Array.from({ length: slotCols + 1 }, () => 0);
        let runningSlots = 0;

        rowCells.forEach((cell, cellIndex) => {
            const width = getCellWidth(cell);
            for (let offset = 0; offset < width && runningSlots + offset <= slotCols; offset += 1) {
                slotToChar[runningSlots + offset] = cellIndex;
            }
            runningSlots += width;
            charToSlot.push(runningSlots);
            if (runningSlots <= slotCols) slotToChar[runningSlots] = cellIndex + 1;
        });

        while (runningSlots < slotCols) {
            runningSlots += 1;
            slotToChar[runningSlots] = rowCells.length;
        }

        slotToChar[slotCols] = rowCells.length;

        return {
            cells: rowCells,
            slotCols,
            charToSlot,
            slotToChar
        };
    };

    const charOffsetToSlotOffset = (metrics, charOffset) => {
        if (!metrics) return 0;
        const normalized = clamp(charOffset, 0, metrics.charToSlot.length - 1);
        return metrics.charToSlot[normalized] ?? 0;
    };

    const slotOffsetToCharOffset = (metrics, slotOffset) => {
        if (!metrics) return 0;
        const normalized = clamp(slotOffset, 0, metrics.slotCols);
        return metrics.slotToChar[normalized] ?? 0;
    };

    const getCellAtSlot = (rowCells = [], slotOffset = 0, slotCols = measureRowSlots(rowCells)) => {
        const slots = rowToSlotArray(rowCells, slotCols);
        const normalized = clamp(slotOffset, 0, Math.max(slotCols - 1, 0));
        const slot = slots[normalized];
        if (slot === SLOT_CONTINUATION) return slots[normalized - 1] || null;
        return slot || null;
    };

    const getCellIndexAtSlot = (rowCells = [], slotOffset = 0, slotCols = measureRowSlots(rowCells)) => {
        const metrics = buildRowMetrics(rowCells, slotCols);
        const charOffset = slotOffsetToCharOffset(metrics, slotOffset);
        if (charOffset <= 0) return 0;
        return clamp(charOffset - 1, 0, Math.max(rowCells.length - 1, 0));
    };

    const sliceRowBySlotRange = (rowCells = [], startSlot = 0, endSlot = 0, slotCols = measureRowSlots(rowCells)) => {
        const metrics = buildRowMetrics(rowCells, slotCols);
        const rangeStart = clamp(Math.min(startSlot, endSlot), 0, slotCols);
        const rangeEnd = clamp(Math.max(startSlot, endSlot), 0, slotCols);
        const charStart = slotOffsetToCharOffset(metrics, rangeStart);
        const charEnd = slotOffsetToCharOffset(metrics, rangeEnd);
        return rowCells.slice(charStart, charEnd).map((cell) => cloneCell(cell));
    };

    const clearSlotForPlacement = (slots, slotIndex) => {
        const slot = slots[slotIndex];
        if (slot === SLOT_CONTINUATION) {
            slots[slotIndex] = null;
            if (slotIndex > 0 && slots[slotIndex - 1] && slots[slotIndex - 1] !== SLOT_CONTINUATION) {
                const startCell = slots[slotIndex - 1];
                const width = getCellWidth(startCell);
                slots[slotIndex - 1] = null;
                if (width === 2 && slotIndex < slots.length) slots[slotIndex] = null;
            }
            return;
        }

        if (!slot) return;
        const width = getCellWidth(slot);
        slots[slotIndex] = null;
        if (width === 2 && slotIndex + 1 < slots.length) slots[slotIndex + 1] = null;
    };

    const placeCellInSlotArray = (slots, slotIndex, cell) => {
        const nextCell = cloneCell(cell);
        const width = getCellWidth(nextCell);
        if (slotIndex < 0 || slotIndex >= slots.length) return false;
        if (slotIndex + width > slots.length) return false;

        for (let offset = 0; offset < width; offset += 1) {
            clearSlotForPlacement(slots, slotIndex + offset);
        }

        nextCell.width = width;
        slots[slotIndex] = nextCell;
        if (width === 2) slots[slotIndex + 1] = SLOT_CONTINUATION;
        return true;
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
        const maxSlots = options.maxSlots ?? Infinity;
        const defaultColor = options.defaultColor || DEFAULT_COLOR;
        const cells = [];
        let usedSlots = 0;

        const walk = (node, inheritedStyle) => {
            if (usedSlots >= maxSlots) return;

            if (node.nodeType === Node.TEXT_NODE) {
                Array.from((node.nodeValue || '').replace(/\r?\n/g, '').replace(/\u200b/g, '').replace(/\u00a0/g, ' ')).forEach((char) => {
                    if (usedSlots >= maxSlots) return;
                    const cell = createCell(char, inheritedStyle);
                    cells.push(cell);
                    usedSlots += getCellWidth(cell);
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
        const maxSlots = options.maxSlots ?? Infinity;
        const cells = parseStyledCellsFromHtml(html, options);
        const normalized = maxSlots === Infinity ? cells : truncateRowToSlots(cells, maxSlots);
        return normalized.length > 0 ? buildRichRowHtml(normalized) : '';
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
        const maxCols = options.maxCols ?? ns.DEFAULT_CONFIG.maxSize;
        const maxSlotCols = maxCols * 2;
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
            .slice(0, ns.DEFAULT_CONFIG.maxSize)
            .map((rowNode) => parseStyledCellsFromDom(rowNode, { defaultColor }));

        const nextRows = clamp(rawRows.length || 1, 1, ns.DEFAULT_CONFIG.maxSize);
        const nextSlotCols = clamp(
            rawRows.reduce((maxLength, row) => Math.max(maxLength, measureRowSlots(row)), 2),
            2,
            maxSlotCols
        );
        const nextCols = clamp(Math.ceil(nextSlotCols / 2), 1, maxCols);
        const normalizedSlotCols = nextCols * 2;
        const mapData = createEmptyMap(nextRows, normalizedSlotCols);
        for (let rowIndex = 0; rowIndex < nextRows; rowIndex += 1) {
            mapData[rowIndex] = normalizeRow(rawRows[rowIndex] || [], normalizedSlotCols);
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
        HALF_WIDTH_POOL,
        clamp,
        escapeHtml,
        normalizeSelectedChar,
        normalizeChar,
        normalizeColor,
        getReadableTextColor,
        isHalfWidthChar,
        getCharWidth,
        getCellWidth,
        createCell,
        cloneCell,
        createBlankCell,
        createHalfSpaceCell,
        measureRowSlots,
        normalizeRow,
        truncateRowToSlots,
        createEmptyRow,
        createEmptyMap,
        cloneMapData,
        isSameCell,
        isSameStyle,
        getPlainTextRow,
        getPlainTextMap,
        getCharDisplayUnits,
        buildRowMetrics,
        charOffsetToSlotOffset,
        slotOffsetToCharOffset,
        getCellAtSlot,
        getCellIndexAtSlot,
        sliceRowBySlotRange,
        rowToSlotArray,
        slotArrayToRow,
        placeCellInSlotArray,
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
