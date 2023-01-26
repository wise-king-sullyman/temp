"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogViewer = void 0;
const react_1 = __importStar(require("react"));
const LogViewerContext_1 = require("./LogViewerContext");
const react_styles_1 = require("@patternfly/react-styles");
const LogViewerRow_1 = require("./LogViewerRow");
const utils_1 = require("./utils/utils");
const react_window_1 = require("../react-window");
const log_viewer_1 = __importDefault(require("@patternfly/react-styles/css/components/LogViewer/log-viewer"));
const ansi_up_1 = __importDefault(require("../ansi_up/ansi_up"));
let canvas;
const getCharNums = (windowWidth, font) => {
    // if given, use cached canvas for better performance
    // else, create new canvas
    canvas = canvas || document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    const oneChar = context.measureText('a');
    return Math.floor(windowWidth / oneChar.width);
};
const LogViewerBase = (0, react_1.memo)((_a) => {
    var { data = '', hasLineNumbers = true, height = 600, overScanCount = 10, loadingContent = '', toolbar, width, theme = 'light', scrollToRow = 0, itemCount = undefined, header, footer, onScroll, innerRef, isTextWrapped = true, initialIndexWidth } = _a, props = __rest(_a, ["data", "hasLineNumbers", "height", "overScanCount", "loadingContent", "toolbar", "width", "theme", "scrollToRow", "itemCount", "header", "footer", "onScroll", "innerRef", "isTextWrapped", "initialIndexWidth"]);
    const [searchedInput, setSearchedInput] = (0, react_1.useState)('');
    const [rowInFocus, setRowInFocus] = (0, react_1.useState)({ rowIndex: scrollToRow, matchIndex: 0 });
    const [searchedWordIndexes, setSearchedWordIndexes] = (0, react_1.useState)([]);
    const [currentSearchedItemCount, setCurrentSearchedItemCount] = (0, react_1.useState)(0);
    const [lineHeight, setLineHeight] = (0, react_1.useState)(0);
    const [charNumsPerLine, setCharNumsPerLine] = (0, react_1.useState)(0);
    const [indexWidth, setIndexWidth] = (0, react_1.useState)(0);
    const [resizing, setResizing] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [listKey, setListKey] = (0, react_1.useState)(1);
    /* Parse data every time it changes */
    const parsedData = react_1.default.useMemo(() => (0, utils_1.parseConsoleOutput)(data), [data]);
    const ansiUp = new ansi_up_1.default();
    const ref = react_1.default.useRef();
    const logViewerRef = innerRef || ref;
    const containerRef = react_1.default.useRef();
    let resizeTimer = null;
    (0, react_1.useEffect)(() => {
        if (containerRef && containerRef.current) {
            window.addEventListener('resize', callbackResize);
            setLoading(false);
            createDummyElements();
            ansiUp.resetStyles();
        }
        return () => window.removeEventListener('resize', callbackResize);
    }, [containerRef.current]);
    const callbackResize = () => {
        if (!resizing) {
            setResizing(true);
        }
        if (resizeTimer) {
            clearTimeout(resizeTimer);
        }
        resizeTimer = setTimeout(() => {
            setResizing(false);
            createDummyElements();
        }, 100);
    };
    (0, react_1.useEffect)(() => {
        setLoading(resizing);
    }, [resizing]);
    const dataToRender = react_1.default.useMemo(() => ({
        parsedData,
        logViewerRef,
        rowInFocus,
        searchedWordIndexes
    }), [parsedData, logViewerRef, rowInFocus, searchedWordIndexes]);
    (0, react_1.useEffect)(() => {
        if (logViewerRef && logViewerRef.current) {
            logViewerRef.current.resetAfterIndex(0);
        }
    }, [parsedData]);
    (0, react_1.useEffect)(() => {
        if (scrollToRow && parsedData.length) {
            setRowInFocus({ rowIndex: scrollToRow, matchIndex: 0 });
            // only in this way (setTimeout) the scrollToItem will work
            setTimeout(() => {
                if (logViewerRef && logViewerRef.current) {
                    logViewerRef.current.scrollToItem(scrollToRow, 'center');
                }
            }, 1);
        }
    }, [parsedData, scrollToRow]);
    const createDummyElements = () => {
        // create dummy elements
        const dummyIndex = document.createElement('span');
        dummyIndex.className = (0, react_styles_1.css)(log_viewer_1.default.logViewerIndex);
        const dummyText = document.createElement('span');
        dummyText.className = (0, react_styles_1.css)(log_viewer_1.default.logViewerText);
        const dummyListItem = document.createElement('div');
        dummyListItem.className = (0, react_styles_1.css)(log_viewer_1.default.logViewerListItem);
        const dummyList = document.createElement('div');
        dummyList.className = (0, react_styles_1.css)(log_viewer_1.default.logViewerList);
        // append dummy elements
        dummyListItem.appendChild(dummyIndex);
        dummyListItem.appendChild(dummyText);
        dummyList.appendChild(dummyListItem);
        containerRef.current.appendChild(dummyList);
        // compute styles
        const dummyIndexStyles = getComputedStyle(dummyIndex);
        const dummyTextStyles = getComputedStyle(dummyText);
        setLineHeight(parseFloat(dummyTextStyles.lineHeight));
        const lineWidth = hasLineNumbers
            ? containerRef.current.clientWidth -
                (parseFloat(dummyTextStyles.paddingLeft) +
                    parseFloat(dummyTextStyles.paddingRight) +
                    parseFloat(dummyIndexStyles.width))
            : containerRef.current.clientWidth -
                (parseFloat(dummyTextStyles.paddingLeft) + parseFloat(dummyTextStyles.paddingRight));
        const charNumsPerLine = getCharNums(lineWidth, `${dummyTextStyles.fontWeight} ${dummyTextStyles.fontSize} ${dummyTextStyles.fontFamily}`);
        setCharNumsPerLine(charNumsPerLine);
        setIndexWidth(parseFloat(dummyIndexStyles.width));
        // remove dummy elements from the DOM tree
        containerRef.current.removeChild(dummyList);
        setListKey(listKey => listKey + 1);
    };
    const scrollToRowInFocus = (searchedRowIndex) => {
        setRowInFocus(searchedRowIndex);
        logViewerRef.current.scrollToItem(searchedRowIndex.rowIndex, 'center');
        // use this method to scroll to the right
        // if the keyword is out of the window when wrapping text
        if (!isTextWrapped) {
            setTimeout(() => {
                const element = containerRef.current.querySelector('.pf-c-log-viewer__string.pf-m-current');
                element && element.scrollIntoView({ block: 'nearest', inline: 'center' });
            }, 1);
        }
    };
    (0, react_1.useEffect)(() => {
        setListKey(listKey => listKey + 1);
    }, [isTextWrapped]);
    const guessRowHeight = (rowIndex) => {
        if (!isTextWrapped) {
            return lineHeight;
        }
        // strip ansi escape code before estimate the row height
        const rowText = (0, utils_1.stripAnsi)(parsedData[rowIndex]);
        // get the row numbers of the current text
        const numRows = Math.ceil(rowText.length / charNumsPerLine);
        // multiply by line height to get the total height
        return lineHeight * (numRows || 1);
    };
    const createList = (parsedData) => (react_1.default.createElement(react_window_1.VariableSizeList, { key: listKey, outerClassName: (0, react_styles_1.css)(log_viewer_1.default.logViewerScrollContainer), innerClassName: (0, react_styles_1.css)(log_viewer_1.default.logViewerList), height: containerRef.current.clientHeight, width: containerRef.current.clientWidth, itemSize: guessRowHeight, itemCount: typeof itemCount === 'undefined' ? parsedData.length : itemCount, itemData: dataToRender, ref: logViewerRef, overscanCount: overScanCount, onScroll: onScroll, isTextWrapped: isTextWrapped, hasLineNumbers: hasLineNumbers, indexWidth: indexWidth, ansiUp: ansiUp }, LogViewerRow_1.LogViewerRow));
    return (react_1.default.createElement(LogViewerContext_1.LogViewerContext.Provider, { value: {
            parsedData,
            searchedInput
        } },
        react_1.default.createElement("div", Object.assign({ className: (0, react_styles_1.css)(log_viewer_1.default.logViewer, hasLineNumbers && log_viewer_1.default.modifiers.lineNumbers, !isTextWrapped && log_viewer_1.default.modifiers.nowrap, initialIndexWidth && log_viewer_1.default.modifiers.lineNumberChars, theme === 'dark' && log_viewer_1.default.modifiers.dark) }, (initialIndexWidth && {
            style: {
                '--pf-c-log-viewer--line-number-chars': initialIndexWidth + 1
            }
        }), props),
            toolbar && (react_1.default.createElement(LogViewerContext_1.LogViewerToolbarContext.Provider, { value: {
                    itemCount,
                    searchedInput,
                    rowInFocus,
                    searchedWordIndexes,
                    currentSearchedItemCount,
                    scrollToRow: scrollToRowInFocus,
                    setRowInFocus,
                    setSearchedInput,
                    setSearchedWordIndexes,
                    setCurrentSearchedItemCount
                } },
                react_1.default.createElement("div", { className: (0, react_styles_1.css)(log_viewer_1.default.logViewerHeader) }, toolbar))),
            header,
            react_1.default.createElement("div", { className: (0, react_styles_1.css)(log_viewer_1.default.logViewerMain), style: { height, width }, ref: containerRef }, loading ? react_1.default.createElement("div", null, loadingContent) : createList(parsedData)),
            footer)));
}, react_window_1.areEqual);
exports.LogViewer = react_1.default.forwardRef((props, ref) => (react_1.default.createElement(LogViewerBase, Object.assign({ innerRef: ref }, props))));
exports.LogViewer.displayName = 'LogViewer';
//# sourceMappingURL=LogViewer.js.map