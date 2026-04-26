(function() {
    const ns = window.App.textMap;
    const model = ns?.model;
    if (!ns || !model) return;

    ns.mountEditor = function mountEditor() {
        if (this._cleanup) this._cleanup();
        const t = ns.getStrings();
        const {
            DEFAULT_COLOR: defaultColor,
            clamp,
            normalizeSelectedChar,
            normalizeColor,
            getReadableTextColor,
            createCell,
            createEmptyMap,
            createEmptyRow,
            cloneMapData,
            isSameCell,
            getCellWidth,
            measureRowSlots,
            normalizeRow,
            buildRowMetrics,
            charOffsetToSlotOffset,
            slotOffsetToCharOffset,
            getCellAtSlot,
            sliceRowBySlotRange,
            rowToSlotArray,
            slotArrayToRow,
            placeCellInSlotArray,
            buildRichRowHtml,
            buildRichClipboardPayloadFromCells,
            buildSanitizedClipboardHtml,
            parseStyledCellsFromDom,
            buildErbScript,
            parseErbScript,
            getPlainTextMap,
            getCharDisplayUnits
        } = model;

        const container = document.getElementById('map-container');
        const inpRows = document.getElementById('inp-rows');
        const inpCols = document.getElementById('inp-cols');
        const selFont = document.getElementById('sel-font');
        const lblRows = document.getElementById('lbl-rows');
        const lblCols = document.getElementById('lbl-cols');
        const lblFont = document.getElementById('lbl-font');
        const lblCursor = document.getElementById('lbl-cursor');
        const btnCopyAll = document.getElementById('btn-copy-all');
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');
        const btnExportErb = document.getElementById('btn-export-erb');
        const btnImport = document.getElementById('btn-import');
        const btnModeText = document.getElementById('btn-mode-text');
        const btnModeRect = document.getElementById('btn-mode-rect');
        const toolModeTip = document.getElementById('tool-mode-tip');
        const styleSample = document.getElementById('style-sample');
        const inpSelectedChar = document.getElementById('inp-selected-char');
        const inpTextColor = document.getElementById('inp-text-color');
        const lblTextColor = document.getElementById('lbl-text-color');
        const btnStyleBold = document.getElementById('btn-style-bold');
        const btnStyleUnderline = document.getElementById('btn-style-underline');
        const btnStyleStrike = document.getElementById('btn-style-strike');
        const modal = document.getElementById('modal-import');
        const btnCancelImport = document.getElementById('btn-cancel-import');
        const btnConfirmImport = document.getElementById('btn-confirm-import');
        const txtImport = document.getElementById('import-text');
        const charButtons = Array.from(document.querySelectorAll('.btn-char'));

        let mapData = [];
        let editorMode = 'text';
        let selectedBrush = '';
        let activeRow = 0;
        let selectionState = { row: 0, start: 0, end: 0 };
        let currentTextStyle = { color: defaultColor, bold: false, underline: false, strike: false };
        let rectDrag = null;
        let copyAllResetTimer = null;
        let exportResetTimer = null;
        let composingRow = null;
        let historyStack = [];
        let historyIndex = -1;
        let applyingHistory = false;

        const getSlotCols = () => this.config.cols * 2;
        const getRowCells = (rowIndex) => mapData[rowIndex] || createEmptyRow(getSlotCols());
        const getRowMetrics = (rowIndex, rowCells = getRowCells(rowIndex), slotCols = getSlotCols()) => buildRowMetrics(rowCells, slotCols);

        const formatSlotColumn = (slotOffset) => {
            const value = (slotOffset / 2) + 1;
            return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
        };

        const normalizeSelection = (state = selectionState) => ({
            row: clamp(Number(state.row) || 0, 0, this.config.rows - 1),
            start: clamp(Number(state.start) || 0, 0, getSlotCols()),
            end: clamp(Number(state.end) || 0, 0, getSlotCols())
        });

        const getSelectionBounds = (start, end) => {
            const startColStart = start.start ?? start.colStart ?? start.col;
            const startColEnd = start.end ?? start.colEnd ?? start.col;
            const endColStart = end.start ?? end.colStart ?? end.col;
            const endColEnd = end.end ?? end.colEnd ?? end.col;

            return {
                rowStart: Math.min(start.row, end.row),
                rowEnd: Math.max(start.row, end.row),
                colStart: Math.min(startColStart, endColStart),
                colEnd: Math.max(startColEnd, endColEnd)
            };
        };

        const getRowEditor = (rowIndex) => container.querySelector(`[data-row-editor="${rowIndex}"]`);

        const getTextSelectionCharStateFromDom = () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return null;

            const range = selection.getRangeAt(0);
            const ancestor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
                ? range.commonAncestorContainer
                : range.commonAncestorContainer.parentElement;
            const rowEl = ancestor?.closest?.('[data-row-editor]');

            if (!rowEl || !container.contains(rowEl)) return null;

            const getIndexFromPoint = (node, offset) => {
                const probe = document.createRange();
                probe.setStart(rowEl, 0);
                try {
                    probe.setEnd(node, offset);
                } catch (error) {
                    return 0;
                }
                return Array.from(probe.toString().replace(/\r?\n/g, '')).length;
            };

            return {
                row: Number(rowEl.dataset.row),
                start: getIndexFromPoint(range.startContainer, range.startOffset),
                end: getIndexFromPoint(range.endContainer, range.endOffset)
            };
        };

        const getPointFromCharIndex = (rowEl, charIndex) => {
            const walker = document.createTreeWalker(rowEl, NodeFilter.SHOW_TEXT);
            let remaining = Math.max(charIndex, 0);
            let current = walker.nextNode();

            while (current) {
                const chars = Array.from(current.nodeValue || '');
                if (remaining <= chars.length) {
                    const codeUnitOffset = chars.slice(0, remaining).join('').length;
                    return { node: current, offset: codeUnitOffset };
                }
                remaining -= chars.length;
                current = walker.nextNode();
            }

            return { node: rowEl, offset: rowEl.childNodes.length };
        };

        const mapCharSelectionToSlots = (charSelection, rowCells = getRowCells(charSelection.row), slotCols = getSlotCols()) => {
            const metrics = buildRowMetrics(rowCells, slotCols);
            return normalizeSelection({
                row: charSelection.row,
                start: charOffsetToSlotOffset(metrics, charSelection.start),
                end: charOffsetToSlotOffset(metrics, charSelection.end)
            });
        };

        const refreshRowFocusState = () => {
            Array.from(container.querySelectorAll('[data-row-editor]')).forEach((rowEl) => {
                const rowIndex = Number(rowEl.dataset.row);
                const isActive = editorMode === 'text' && rowIndex === activeRow;

                rowEl.classList.toggle('outline-teal-500', isActive);
                rowEl.classList.toggle('bg-zinc-950/60', isActive);
                rowEl.classList.toggle('outline-transparent', !isActive);
                rowEl.classList.toggle('hover:outline-zinc-800', !isActive);
            });
        };

        const restoreSelection = (state = selectionState, options = {}) => {
            if (editorMode !== 'text') return;

            const normalized = normalizeSelection(state);
            const rowEl = getRowEditor(normalized.row);
            if (!rowEl) return;

            const selection = window.getSelection();
            if (!selection) return;

            const metrics = getRowMetrics(normalized.row);
            const charStart = slotOffsetToCharOffset(metrics, normalized.start);
            const charEnd = slotOffsetToCharOffset(metrics, normalized.end);
            const startPoint = getPointFromCharIndex(rowEl, charStart);
            const endPoint = getPointFromCharIndex(rowEl, charEnd);
            const range = document.createRange();
            range.setStart(startPoint.node, startPoint.offset);
            range.setEnd(endPoint.node, endPoint.offset);
            selection.removeAllRanges();
            selection.addRange(range);

            if (options.focus !== false) rowEl.focus({ preventScroll: true });

            activeRow = normalized.row;
            selectionState = normalized;
            refreshRowFocusState();
        };

        const updateCursorLabel = () => {
            const normalized = normalizeSelection(selectionState);
            lblCursor.textContent = `${normalized.row + 1}, ${formatSlotColumn(normalized.start)}`;
        };

        const buildHistorySnapshot = () => ({
            rows: this.config.rows,
            cols: this.config.cols,
            mapData: cloneMapData(mapData)
        });

        const getHistoryKey = (snapshot) => JSON.stringify(snapshot);

        const syncHistoryButtons = () => {
            const updateButton = (button, enabled) => {
                button.disabled = !enabled;
                button.className = enabled
                    ? 'px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 shadow-sm'
                    : 'px-3 py-2 bg-zinc-100 border border-zinc-200 rounded text-xs font-bold text-zinc-400 flex items-center gap-1 shadow-sm cursor-not-allowed';
            };

            updateButton(btnUndo, historyIndex > 0);
            updateButton(btnRedo, historyIndex >= 0 && historyIndex < historyStack.length - 1);
        };

        const applyHistorySnapshot = (snapshot) => {
            applyingHistory = true;

            this.config.rows = snapshot.rows;
            this.config.cols = snapshot.cols;
            inpRows.value = snapshot.rows;
            inpCols.value = snapshot.cols;
            lblRows.textContent = snapshot.rows;
            lblCols.textContent = snapshot.cols;
            mapData = cloneMapData(snapshot.mapData);
            activeRow = clamp(activeRow, 0, this.config.rows - 1);
            selectionState = normalizeSelection({
                row: activeRow,
                start: selectionState.start,
                end: selectionState.end
            });
            rectDrag = null;

            renderRows({ focus: editorMode === 'text' });
            updateCursorLabel();
            updateCurrentStyleFromSelection();

            applyingHistory = false;
        };

        const pushHistory = () => {
            if (applyingHistory) return;

            const snapshot = buildHistorySnapshot();
            const nextKey = getHistoryKey(snapshot);
            const currentKey = historyIndex >= 0 ? getHistoryKey(historyStack[historyIndex]) : '';
            if (nextKey === currentKey) {
                syncHistoryButtons();
                return;
            }

            historyStack = historyStack.slice(0, historyIndex + 1);
            historyStack.push(snapshot);
            if (historyStack.length > 120) historyStack.shift();
            historyIndex = historyStack.length - 1;
            syncHistoryButtons();
        };

        const undoHistory = () => {
            if (historyIndex <= 0) return;
            historyIndex -= 1;
            applyHistorySnapshot(historyStack[historyIndex]);
            syncHistoryButtons();
        };

        const redoHistory = () => {
            if (historyIndex >= historyStack.length - 1) return;
            historyIndex += 1;
            applyHistorySnapshot(historyStack[historyIndex]);
            syncHistoryButtons();
        };

        const getFallbackStyleFromSelection = () => {
            const normalized = normalizeSelection(selectionState);
            const slotIndex = clamp(normalized.start > 0 ? normalized.start - 1 : normalized.start, 0, Math.max(getSlotCols() - 1, 0));
            const cell = getCellAtSlot(getRowCells(normalized.row), slotIndex, getSlotCols()) || createCell();
            return {
                color: normalizeColor(cell.color),
                bold: Boolean(cell.bold),
                underline: Boolean(cell.underline),
                strike: Boolean(cell.strike)
            };
        };

        const updateStyleSample = () => {
            const textDecoration = [
                currentTextStyle.underline ? 'underline' : '',
                currentTextStyle.strike ? 'line-through' : ''
            ].filter(Boolean).join(' ') || 'none';

            inpTextColor.value = currentTextStyle.color;
            lblTextColor.textContent = currentTextStyle.color;
            lblTextColor.style.color = getReadableTextColor(currentTextStyle.color);
            lblTextColor.style.backgroundColor = currentTextStyle.color;
            lblTextColor.style.borderColor = currentTextStyle.color;
            styleSample.textContent = selectedBrush || 'Aa';
            styleSample.style.color = currentTextStyle.color;
            styleSample.style.fontWeight = currentTextStyle.bold ? '700' : '400';
            styleSample.style.textDecoration = textDecoration;
            styleSample.style.backgroundColor = getReadableTextColor(currentTextStyle.color) === '#ffffff' ? '#09090b' : '#fafafa';
            styleSample.style.borderColor = currentTextStyle.color;

            const syncToggleButton = (button, active) => {
                button.className = active
                    ? 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-teal-500 border-teal-600 text-white'
                    : 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50';
            };

            syncToggleButton(btnStyleBold, currentTextStyle.bold);
            syncToggleButton(btnStyleUnderline, currentTextStyle.underline);
            syncToggleButton(btnStyleStrike, currentTextStyle.strike);
        };

        const updateCurrentStyleFromSelection = () => {
            if (editorMode !== 'text') {
                updateStyleSample();
                return;
            }

            const selection = window.getSelection();
            const rowEl = getRowEditor(activeRow);
            const selectionInsideEditor = Boolean(
                selection &&
                selection.rangeCount > 0 &&
                rowEl &&
                rowEl.contains(selection.anchorNode)
            );

            const safeQueryState = (command) => {
                try {
                    return Boolean(document.queryCommandState(command));
                } catch (error) {
                    return false;
                }
            };

            const safeQueryValue = (command) => {
                try {
                    return document.queryCommandValue(command) || '';
                } catch (error) {
                    return '';
                }
            };

            if (selectionInsideEditor && typeof document.queryCommandState === 'function') {
                const fallbackStyle = getFallbackStyleFromSelection();
                const queriedColorValue = safeQueryValue('foreColor');
                const queriedColor = queriedColorValue ? normalizeColor(queriedColorValue) : fallbackStyle.color;
                currentTextStyle = {
                    color: queriedColor,
                    bold: safeQueryState('bold') || fallbackStyle.bold,
                    underline: safeQueryState('underline') || fallbackStyle.underline,
                    strike: safeQueryState('strikeThrough') || fallbackStyle.strike
                };
            } else {
                currentTextStyle = getFallbackStyleFromSelection();
            }

            updateStyleSample();
        };

        const setSelectedBrush = (value) => {
            selectedBrush = normalizeSelectedChar(value);
            inpSelectedChar.value = selectedBrush;
            updateStyleSample();
            syncModeUI();
        };

        const syncModeUI = () => {
            const isTextMode = editorMode === 'text';
            const isRectMode = editorMode === 'rect';

            btnModeText.className = isTextMode
                ? 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-teal-500 border-teal-600 text-white'
                : 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50';
            btnModeRect.className = isRectMode
                ? 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-teal-500 border-teal-600 text-white'
                : 'px-3 py-2 rounded border text-xs font-bold transition-colors bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50';

            inpSelectedChar.className = selectedBrush
                ? 'w-full h-9 px-2 rounded bg-teal-50 border border-teal-400 text-sm font-mono font-black text-center text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500'
                : 'w-full h-9 px-2 rounded bg-white border border-zinc-300 text-sm font-mono font-black text-center text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500';

            toolModeTip.textContent = isTextMode
                ? t.tipText
                : (selectedBrush ? ns.formatString(t.tipRectSelected, { char: selectedBrush }) : t.tipRectIdle);

            charButtons.forEach((button) => {
                const isSelected = selectedBrush && button.dataset.char === selectedBrush;
                button.className = isSelected
                    ? 'btn-char w-full h-6 bg-teal-500 text-white ring-2 ring-teal-200 font-mono text-lg leading-none flex items-center justify-center transition-colors'
                    : 'btn-char w-full h-6 bg-white hover:bg-teal-500 hover:text-white font-mono text-lg leading-none flex items-center justify-center transition-colors';
            });
        };

        const copyClipboardPayload = ({ text = '', html = '' }) => {
            if (!text && !html) return Promise.resolve(false);

            if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined' && html) {
                return navigator.clipboard.write([
                    new ClipboardItem({
                        'text/plain': new Blob([text], { type: 'text/plain' }),
                        'text/html': new Blob([html], { type: 'text/html' })
                    })
                ]).then(() => true).catch(() => (
                    navigator.clipboard.writeText(text).then(() => true).catch(() => false)
                ));
            }

            return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
        };

        const buildRichClipboardPayloadForRow = (rowIndex) => buildRichClipboardPayloadFromCells(getRowCells(rowIndex));

        const buildRichClipboardPayloadForSelection = (state = selectionState) => {
            const normalized = normalizeSelection(state);
            const start = Math.min(normalized.start, normalized.end);
            const end = Math.max(normalized.start, normalized.end);
            if (start === end) return null;

            const rowCells = sliceRowBySlotRange(getRowCells(normalized.row), start, end, getSlotCols());
            return buildRichClipboardPayloadFromCells(rowCells);
        };

        const buildRichClipboardPayloadForMap = () => ({
            text: getPlainTextMap(mapData),
            html: mapData.map((rowCells) => buildRichRowHtml(rowCells, { preserveSpaces: true })).join('<br>')
        });

        const buildRectCellMarkup = (cell, rowIndex, slotStart) => {
            const slotWidth = getCellWidth(cell);
            const previewBounds = rectDrag ? getSelectionBounds(rectDrag.anchor, rectDrag.hover) : null;
            const isPreview = Boolean(
                previewBounds &&
                rowIndex >= previewBounds.rowStart &&
                rowIndex <= previewBounds.rowEnd &&
                slotStart <= previewBounds.colEnd &&
                slotStart + slotWidth - 1 >= previewBounds.colStart
            );
            const textDecoration = [
                cell.underline ? 'underline' : '',
                cell.strike ? 'line-through' : ''
            ].filter(Boolean).join(' ') || 'none';
            const displayChar = model.escapeHtml(cell.char);

            return `<span class="flex min-w-0 items-center justify-center border transition-colors ${isPreview ? 'border-amber-300 bg-zinc-900' : 'border-transparent'}" data-char-slot="true" data-row="${rowIndex}" data-slot-start="${slotStart}" data-slot-width="${slotWidth}" style="grid-column:span ${slotWidth};height:1.1em;box-sizing:border-box;color:${cell.color};font-weight:${cell.bold ? '700' : '400'};line-height:1;text-decoration:${textDecoration};vertical-align:top;white-space:pre;">${displayChar}</span>`;
        };

        const renderRows = (options = {}) => {
            const isEraMono = this.config.font.includes('ERA MONO SC');
            const slotCols = getSlotCols();

            container.innerHTML = mapData.map((rowCells, rowIndex) => {
                let rowBody = buildRichRowHtml(rowCells);
                const rowWhiteSpace = editorMode === 'text' ? 'pre' : 'normal';
                if (editorMode === 'rect') {
                    let slotStart = 0;
                    rowBody = `<div class="inline-grid items-stretch leading-none whitespace-nowrap align-top" style="grid-template-columns:repeat(${slotCols}, minmax(0, 1ch));">${rowCells.map((cell) => {
                        const markup = buildRectCellMarkup(cell, rowIndex, slotStart);
                        slotStart += getCellWidth(cell);
                        return markup;
                    }).join('')}</div>`;
                }

                return `
                    <div class="flex items-center gap-2 group w-full">
                        <div class="text-[10px] text-zinc-600 font-mono w-8 text-right select-none shrink-0">${rowIndex + 1}</div>
                        <div
                            class="map-row-editor px-2 py-0 rounded outline outline-1 -outline-offset-1 transition-colors ${editorMode === 'text' ? 'cursor-text selection:bg-teal-500 selection:text-white' : 'cursor-crosshair'} ${editorMode === 'text' && activeRow === rowIndex ? 'outline-teal-500 bg-zinc-950/60' : 'outline-transparent hover:outline-zinc-800'}"
                            data-row-editor="${rowIndex}"
                            data-row="${rowIndex}"
                            contenteditable="${editorMode === 'text' ? 'true' : 'false'}"
                            spellcheck="false"
                            style="
                                white-space:${rowWhiteSpace};
                                display:block;
                                font-family:${this.config.font};
                                font-size:1.25rem;
                                line-height:1.0;
                                min-width:100%;
                                width:max-content;
                                padding-top:${editorMode === 'text' && isEraMono ? '3px' : '0px'};
                            "
                        >${rowBody}</div>
                        <button
                            type="button"
                            class="opacity-0 group-hover:opacity-100 text-teal-600 hover:text-teal-400 shrink-0 transition-opacity"
                            data-copy-row="${rowIndex}"
                            title="${ns.formatString(t.copyRowTitle, { row: rowIndex + 1 })}"
                        >
                            <i data-lucide="copy" class="w-3 h-3"></i>
                        </button>
                    </div>
                `;
            }).join('');

            if (window.lucide) window.lucide.createIcons();

            if (editorMode === 'text' && options.restoreSelection !== false) {
                restoreSelection(selectionState, { focus: options.focus !== false });
            } else {
                refreshRowFocusState();
            }
        };

        const parseRowDom = (rowEl) => normalizeRow(
            parseStyledCellsFromDom(rowEl, { defaultColor }),
            getSlotCols()
        );

        const syncRowFromEditor = (rowIndex, options = {}) => {
            const rowEl = getRowEditor(rowIndex);
            if (!rowEl) return;

            const rawCells = parseStyledCellsFromDom(rowEl, { defaultColor });
            const rawSlotCols = Math.max(measureRowSlots(rawCells), 0);
            const charSelection = getTextSelectionCharStateFromDom();
            mapData[rowIndex] = normalizeRow(rawCells, getSlotCols());

            if (charSelection && charSelection.row === rowIndex) {
                const rawMetrics = buildRowMetrics(rawCells, rawSlotCols);
                activeRow = rowIndex;
                selectionState = normalizeSelection({
                    row: rowIndex,
                    start: charOffsetToSlotOffset(rawMetrics, charSelection.start),
                    end: charOffsetToSlotOffset(rawMetrics, charSelection.end)
                });
            } else if (options.selectionState) {
                selectionState = normalizeSelection(options.selectionState);
                activeRow = selectionState.row;
            }

            if (options.render !== false) {
                renderRows({ focus: options.focus !== false });
            }

            updateCursorLabel();
            updateCurrentStyleFromSelection();
            if (options.pushHistory !== false) pushHistory();
        };

        const syncAllRowsFromDom = (options = {}) => {
            if (editorMode !== 'text') return;

            const charSelection = getTextSelectionCharStateFromDom();
            const rawRows = [];

            for (let rowIndex = 0; rowIndex < this.config.rows; rowIndex += 1) {
                const rowEl = getRowEditor(rowIndex);
                const rawCells = rowEl ? parseStyledCellsFromDom(rowEl, { defaultColor }) : getRowCells(rowIndex);
                rawRows[rowIndex] = rawCells;
                mapData[rowIndex] = normalizeRow(rawCells, getSlotCols());
            }

            if (charSelection) {
                const selectedRawRow = rawRows[charSelection.row] || [];
                const rawMetrics = buildRowMetrics(selectedRawRow, Math.max(measureRowSlots(selectedRawRow), 0));
                selectionState = normalizeSelection({
                    row: charSelection.row,
                    start: charOffsetToSlotOffset(rawMetrics, charSelection.start),
                    end: charOffsetToSlotOffset(rawMetrics, charSelection.end)
                });
                activeRow = charSelection.row;
            }

            if (options.render) renderRows({ focus: options.focus !== false });
        };

        const focusRowAt = (rowIndex, slotOffset) => {
            activeRow = clamp(rowIndex, 0, this.config.rows - 1);
            selectionState = normalizeSelection({ row: activeRow, start: slotOffset, end: slotOffset });
            renderRows({ focus: true });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
        };

        const resizeMap = (rows, cols) => {
            if (editorMode === 'text') syncAllRowsFromDom();

            const previousSlotCols = getSlotCols();
            this.config.rows = clamp(rows, 1, this.config.maxSize);
            this.config.cols = clamp(cols, 1, this.config.maxSize);
            const nextSlotCols = getSlotCols();

            inpRows.value = this.config.rows;
            inpCols.value = this.config.cols;
            lblRows.textContent = this.config.rows;
            lblCols.textContent = this.config.cols;

            const nextMap = createEmptyMap(this.config.rows, nextSlotCols);
            for (let rowIndex = 0; rowIndex < this.config.rows; rowIndex += 1) {
                const currentSlots = rowToSlotArray(mapData[rowIndex] || [], previousSlotCols);
                const resizedSlots = Array.from({ length: nextSlotCols }, (_, index) => currentSlots[index] ?? null);
                nextMap[rowIndex] = normalizeRow(slotArrayToRow(resizedSlots, nextSlotCols), nextSlotCols);
            }

            mapData = nextMap;
            activeRow = clamp(activeRow, 0, this.config.rows - 1);
            selectionState = normalizeSelection({
                row: activeRow,
                start: selectionState.start,
                end: selectionState.end
            });
            renderRows({ focus: editorMode === 'text' });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
            pushHistory();
        };

        const applyLoadedMap = (rows, cols, nextMapData) => {
            this.config.rows = clamp(rows, 1, this.config.maxSize);
            this.config.cols = clamp(cols, 1, this.config.maxSize);
            const slotCols = getSlotCols();

            inpRows.value = this.config.rows;
            inpCols.value = this.config.cols;
            lblRows.textContent = this.config.rows;
            lblCols.textContent = this.config.cols;

            mapData = createEmptyMap(this.config.rows, slotCols);
            for (let rowIndex = 0; rowIndex < this.config.rows; rowIndex += 1) {
                mapData[rowIndex] = normalizeRow(nextMapData[rowIndex] || [], slotCols);
            }

            activeRow = 0;
            rectDrag = null;
            selectionState = { row: 0, start: 0, end: 0 };
            renderRows({ focus: editorMode === 'text' });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
        };

        const loadPlainTextMap = (text) => {
            const lines = String(text || '').replace(/\r/g, '').split('\n');
            const safeLines = lines.length > 0 ? lines : [''];
            const nextRows = clamp(safeLines.length, 1, this.config.maxSize);
            const rawRows = [];
            let maxSlotCols = 2;

            for (let rowIndex = 0; rowIndex < nextRows; rowIndex += 1) {
                const cells = Array.from(safeLines[rowIndex] || '').map((char) => createCell(char));
                rawRows[rowIndex] = cells;
                maxSlotCols = Math.max(maxSlotCols, measureRowSlots(cells));
            }

            const nextCols = clamp(Math.ceil(maxSlotCols / 2), 1, this.config.maxSize);
            const normalizedSlotCols = nextCols * 2;
            const nextMapData = createEmptyMap(nextRows, normalizedSlotCols);
            for (let rowIndex = 0; rowIndex < nextRows; rowIndex += 1) {
                nextMapData[rowIndex] = normalizeRow(rawRows[rowIndex] || [], normalizedSlotCols);
            }

            applyLoadedMap(nextRows, nextCols, nextMapData);
            pushHistory();
        };

        const loadErbMap = (text) => {
            const parsed = parseErbScript(text, { maxCols: this.config.maxSize, defaultColor });
            if (!parsed) return false;

            applyLoadedMap(parsed.rows, parsed.cols, parsed.mapData);
            pushHistory();
            return true;
        };

        const downloadFile = (filename, content) => {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        };

        const applyStyleCommand = (command, value) => {
            if (editorMode !== 'text') return;

            restoreSelection(selectionState, { focus: true });

            try {
                document.execCommand('styleWithCSS', false, true);
            } catch (error) {
                // Ignore unsupported browsers and fall back to normal command calls.
            }

            if (typeof document.execCommand === 'function') {
                document.execCommand(command, false, value);
            }

            const normalized = normalizeSelection(selectionState);
            if (normalized.start !== normalized.end) {
                syncRowFromEditor(activeRow, { focus: true });
            } else {
                updateCurrentStyleFromSelection();
            }
        };

        const copyToolCharacter = (char) => copyClipboardPayload(
            buildRichClipboardPayloadFromCells([createCell(char, currentTextStyle)])
        );

        const applyRectangleFill = (start, end) => {
            if (!selectedBrush) return;

            if (editorMode === 'text') syncAllRowsFromDom();

            const bounds = getSelectionBounds(start, end);
            const slotCols = getSlotCols();
            const brushCell = createCell(selectedBrush, currentTextStyle);
            const brushWidth = getCellWidth(brushCell);
            let changed = false;

            for (let rowIndex = bounds.rowStart; rowIndex <= bounds.rowEnd; rowIndex += 1) {
                const before = JSON.stringify(getRowCells(rowIndex));
                const slots = rowToSlotArray(getRowCells(rowIndex), slotCols);
                for (let colIndex = bounds.colStart; colIndex <= bounds.colEnd; colIndex += brushWidth) {
                    placeCellInSlotArray(slots, colIndex, brushCell);
                }
                const nextRow = normalizeRow(slotArrayToRow(slots, slotCols), slotCols);
                if (JSON.stringify(nextRow) !== before) {
                    mapData[rowIndex] = nextRow;
                    changed = true;
                }
            }

            activeRow = bounds.rowStart;
            selectionState = normalizeSelection({ row: activeRow, start: bounds.colStart, end: bounds.colStart });
            renderRows({ focus: false });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
            if (changed) pushHistory();
        };

        const getRectSlotTargetFromEvent = (event) => {
            const slot = event.target.closest('[data-char-slot="true"]');
            if (!slot || !container.contains(slot)) return null;

            const slotWidth = Number(slot.dataset.slotWidth) || 1;
            const slotStart = Number(slot.dataset.slotStart) || 0;

            return {
                row: Number(slot.dataset.row),
                colStart: slotStart,
                colEnd: slotStart + slotWidth - 1
            };
        };

        const checkFonts = () => {
            const options = selFont.querySelectorAll('option');
            options.forEach((option) => {
                if (!option.innerText.includes(t.installRequiredMarker)) return;

                const fontName = option.value.split(',')[0].replace(/['"]/g, '');
                if (!document.fonts?.check || document.fonts.check(`12px ${fontName}`)) return;
                option.disabled = true;
                option.style.color = '#ccc';
            });
        };

        const preserveTextSelection = (event) => {
            if (editorMode !== 'text') return;
            if (event.target.matches('input[type="color"]')) return;
            event.preventDefault();
        };

        const captureSelectionFromDom = () => {
            if (editorMode !== 'text') return;

            const charSelection = getTextSelectionCharStateFromDom();
            if (!charSelection) return;

            selectionState = mapCharSelectionToSlots(charSelection);
            activeRow = charSelection.row;
            refreshRowFocusState();
            updateCursorLabel();
            updateCurrentStyleFromSelection();
        };

        const handleEditorShortcuts = (event) => {
            if (modal && !modal.classList.contains('hidden')) return;
            if (!(event.ctrlKey || event.metaKey)) return;

            const key = event.key.toLowerCase();
            if (key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undoHistory();
            } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
                event.preventDefault();
                redoHistory();
            }
        };

        const looksLikeErbImport = (text) => /htmlString\s*\+=|HTML_PRINT\s+htmlString|#DIMS\s+DYNAMIC\s+htmlString/i.test(String(text || ''));

        if (document.fonts?.ready) {
            document.fonts.ready.then(checkFonts);
        } else {
            checkFonts();
        }

        if (typeof document.execCommand === 'function') {
            try {
                document.execCommand('styleWithCSS', false, true);
            } catch (error) {
                // Ignore.
            }
        }

        inpRows.addEventListener('change', (event) => resizeMap(parseInt(event.target.value, 10), this.config.cols));
        inpCols.addEventListener('change', (event) => resizeMap(this.config.rows, parseInt(event.target.value, 10)));

        selFont.addEventListener('change', (event) => {
            if (editorMode === 'text') syncAllRowsFromDom();
            this.config.font = event.target.value;
            lblFont.textContent = event.target.options[event.target.selectedIndex].text.split(' ')[0];
            renderRows({ focus: editorMode === 'text' });
        });

        btnModeText.addEventListener('click', () => {
            editorMode = 'text';
            rectDrag = null;
            syncModeUI();
            renderRows({ focus: true });
            updateCursorLabel();
            updateCurrentStyleFromSelection();
        });

        btnModeRect.addEventListener('click', () => {
            if (editorMode === 'text') syncAllRowsFromDom();
            editorMode = 'rect';
            rectDrag = null;
            syncModeUI();
            renderRows({ focus: false });
        });

        [btnStyleBold, btnStyleUnderline, btnStyleStrike].forEach((button) => {
            button.addEventListener('mousedown', preserveTextSelection);
        });
        charButtons.forEach((button) => {
            button.addEventListener('mousedown', preserveTextSelection);
        });

        charButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const currentChar = button.dataset.char || button.innerText;
                setSelectedBrush(currentChar);

                if (editorMode === 'text') {
                    copyToolCharacter(currentChar);
                    return;
                }

                renderRows({ focus: false });
            });
        });

        btnUndo.addEventListener('click', () => undoHistory());
        btnRedo.addEventListener('click', () => redoHistory());

        inpSelectedChar.addEventListener('focus', (event) => {
            event.target.select();
        });
        inpSelectedChar.addEventListener('input', (event) => {
            setSelectedBrush(event.target.value);
        });

        inpTextColor.addEventListener('mousedown', () => {
            if (editorMode === 'text') captureSelectionFromDom();
        });
        inpTextColor.addEventListener('input', (event) => {
            const nextColor = normalizeColor(event.target.value);
            currentTextStyle.color = nextColor;
            updateStyleSample();

            if (editorMode === 'text') applyStyleCommand('foreColor', nextColor);
        });

        btnStyleBold.addEventListener('click', () => applyStyleCommand('bold'));
        btnStyleUnderline.addEventListener('click', () => applyStyleCommand('underline'));
        btnStyleStrike.addEventListener('click', () => applyStyleCommand('strikeThrough'));

        btnCopyAll.addEventListener('click', () => {
            if (editorMode === 'text') syncAllRowsFromDom();

            copyClipboardPayload(buildRichClipboardPayloadForMap());
            btnCopyAll.textContent = t.copied;

            if (copyAllResetTimer) clearTimeout(copyAllResetTimer);
            copyAllResetTimer = setTimeout(() => {
                btnCopyAll.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i> ${t.copyAll}`;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });

        btnExportErb.addEventListener('click', () => {
            if (editorMode === 'text') syncAllRowsFromDom();

            const now = new Date();
            const filename = `text-map-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.erb`;
            downloadFile(filename, buildErbScript(mapData, {
                defaultColor,
                headerTemplate: t.erbHeader,
                formatString: ns.formatString
            }));
            btnExportErb.textContent = t.exported;

            if (exportResetTimer) clearTimeout(exportResetTimer);
            exportResetTimer = setTimeout(() => {
                btnExportErb.innerHTML = `<i data-lucide="file-down" class="w-3 h-3"></i> ${t.exportErb}`;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });

        btnImport.onclick = () => {
            modal.classList.remove('hidden');
            txtImport.focus();
        };

        btnCancelImport.onclick = () => {
            modal.classList.add('hidden');
            txtImport.value = '';
            if (editorMode === 'text') restoreSelection(selectionState, { focus: true });
        };

        btnConfirmImport.onclick = () => {
            const importText = txtImport.value;
            if (looksLikeErbImport(importText)) {
                if (!loadErbMap(importText)) {
                    window.alert(t.importInvalidErb);
                    txtImport.focus();
                    return;
                }
            } else {
                loadPlainTextMap(importText);
            }

            modal.classList.add('hidden');
            txtImport.value = '';
        };

        container.addEventListener('click', (event) => {
            const copyRowButton = event.target.closest('[data-copy-row]');
            if (copyRowButton) {
                if (editorMode === 'text') syncAllRowsFromDom();
                copyClipboardPayload(buildRichClipboardPayloadForRow(Number(copyRowButton.dataset.copyRow)));
            }
        });

        container.addEventListener('copy', (event) => {
            if (editorMode !== 'text') return;

            const charSelection = getTextSelectionCharStateFromDom();
            if (!charSelection) return;
            const domSelection = mapCharSelectionToSlots(charSelection);

            const rowEl = getRowEditor(domSelection.row);
            if (rowEl) mapData[domSelection.row] = parseRowDom(rowEl);

            const payload = buildRichClipboardPayloadForSelection(domSelection);
            if (!payload) return;

            selectionState = domSelection;
            activeRow = domSelection.row;
            event.preventDefault();

            if (event.clipboardData) {
                event.clipboardData.setData('text/plain', payload.text);
                event.clipboardData.setData('text/html', payload.html);
            } else {
                copyClipboardPayload(payload);
            }
        });

        container.addEventListener('focusin', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            activeRow = Number(rowEl.dataset.row);
            requestAnimationFrame(captureSelectionFromDom);
        });

        container.addEventListener('mouseup', () => {
            if (editorMode !== 'text') return;
            requestAnimationFrame(captureSelectionFromDom);
        });

        container.addEventListener('keyup', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                const normalized = normalizeSelection(selectionState);
                focusRowAt(normalized.row - 1, normalized.start);
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                const normalized = normalizeSelection(selectionState);
                focusRowAt(normalized.row + 1, normalized.start);
                return;
            }

            requestAnimationFrame(captureSelectionFromDom);
        });

        container.addEventListener('keydown', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            if (event.key === 'Enter') {
                event.preventDefault();
                const normalized = normalizeSelection(selectionState);
                focusRowAt(normalized.row + 1, normalized.start);
            } else if (event.key === 'Tab') {
                event.preventDefault();
                const normalized = normalizeSelection(selectionState);
                focusRowAt(activeRow, event.shiftKey ? normalized.start - 1 : normalized.start + 1);
            }
        });

        container.addEventListener('paste', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            event.preventDefault();
            const pastedHtml = event.clipboardData?.getData('text/html') || '';
            const sanitizedHtml = pastedHtml
                ? buildSanitizedClipboardHtml(pastedHtml, { maxSlots: getSlotCols(), defaultColor })
                : '';
            const rowIndex = Number(rowEl.dataset.row);

            if (sanitizedHtml && typeof document.execCommand === 'function') {
                document.execCommand('insertHTML', false, sanitizedHtml);
                requestAnimationFrame(() => syncRowFromEditor(rowIndex, { focus: true }));
                return;
            }

            const pastedText = (event.clipboardData?.getData('text/plain') || '').replace(/\r?\n/g, '');
            if (typeof document.execCommand === 'function') {
                document.execCommand('insertText', false, pastedText);
                requestAnimationFrame(() => syncRowFromEditor(rowIndex, { focus: true }));
            }
        });

        container.addEventListener('input', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            const rowIndex = Number(rowEl.dataset.row);
            if (composingRow === rowIndex) return;

            syncRowFromEditor(rowIndex, { focus: true });
        });

        container.addEventListener('compositionstart', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;
            composingRow = Number(rowEl.dataset.row);
        });

        container.addEventListener('compositionend', (event) => {
            const rowEl = event.target.closest('[data-row-editor]');
            if (!rowEl || editorMode !== 'text') return;

            const rowIndex = Number(rowEl.dataset.row);
            composingRow = null;
            syncRowFromEditor(rowIndex, { focus: true });
        });

        container.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;
            if (editorMode !== 'rect') return;

            const target = getRectSlotTargetFromEvent(event);
            if (!target || !selectedBrush) return;

            rectDrag = { anchor: target, hover: target };
            activeRow = target.row;
            selectionState = normalizeSelection({ row: target.row, start: target.colStart, end: target.colStart });
            renderRows({ focus: false });
            event.preventDefault();
        });

        container.addEventListener('mouseover', (event) => {
            if (editorMode !== 'rect' || !rectDrag) return;

            const target = getRectSlotTargetFromEvent(event);
            if (!target) return;
            if (
                target.row === rectDrag.hover.row &&
                target.colStart === rectDrag.hover.colStart &&
                target.colEnd === rectDrag.hover.colEnd
            ) return;

            rectDrag.hover = target;
            renderRows({ focus: false });
        });

        const handleMouseUp = () => {
            if (editorMode !== 'rect' || !rectDrag) return;

            const finalRect = rectDrag;
            rectDrag = null;
            applyRectangleFill(finalRect.anchor, finalRect.hover);
        };

        document.addEventListener('selectionchange', captureSelectionFromDom);
        document.addEventListener('keydown', handleEditorShortcuts);
        document.addEventListener('mouseup', handleMouseUp);

        mapData = createEmptyMap(ns.DEFAULT_CONFIG.rows, ns.DEFAULT_CONFIG.cols * 2);
        lblFont.textContent = 'MS Gothic';
        syncModeUI();
        renderRows({ focus: true });
        updateCursorLabel();
        updateCurrentStyleFromSelection();
        pushHistory();
        syncHistoryButtons();

        if (window.lucide) window.lucide.createIcons();

        this._cleanup = () => {
            document.removeEventListener('selectionchange', captureSelectionFromDom);
            document.removeEventListener('keydown', handleEditorShortcuts);
            document.removeEventListener('mouseup', handleMouseUp);
            if (copyAllResetTimer) clearTimeout(copyAllResetTimer);
            if (exportResetTimer) clearTimeout(exportResetTimer);
        };
    };
})();
