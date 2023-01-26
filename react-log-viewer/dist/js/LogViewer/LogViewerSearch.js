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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogViewerSearch = void 0;
const react_1 = __importStar(require("react"));
const constants_1 = require("./utils/constants");
const react_core_1 = require("@patternfly/react-core");
const LogViewerContext_1 = require("./LogViewerContext");
const utils_1 = require("./utils/utils");
const LogViewerSearch = (_a) => {
    var _b;
    var { placeholder = 'Search', minSearchChars = 1 } = _a, props = __rest(_a, ["placeholder", "minSearchChars"]);
    const [indexAdjuster, setIndexAdjuster] = (0, react_1.useState)(0);
    const { searchedWordIndexes, scrollToRow, setSearchedInput, setCurrentSearchedItemCount, setRowInFocus, setSearchedWordIndexes, currentSearchedItemCount, searchedInput, itemCount } = (0, react_1.useContext)(LogViewerContext_1.LogViewerToolbarContext);
    const { parsedData } = (0, react_1.useContext)(LogViewerContext_1.LogViewerContext);
    const defaultRowInFocus = { rowIndex: constants_1.DEFAULT_FOCUS, matchIndex: constants_1.DEFAULT_MATCH };
    /* Defaulting the first focused row that contain searched keywords */
    (0, react_1.useEffect)(() => {
        if (hasFoundResults) {
            setIndexAdjuster(1);
        }
        else {
            setIndexAdjuster(0);
        }
    }, [searchedWordIndexes]);
    /* Updating searchedResults context state given changes in searched input */
    (0, react_1.useEffect)(() => {
        let foundKeywordIndexes = [];
        const adjustedSearchedInput = (0, utils_1.escapeString)(searchedInput);
        if (adjustedSearchedInput !== '' && adjustedSearchedInput.length >= minSearchChars) {
            foundKeywordIndexes = (0, utils_1.searchForKeyword)(adjustedSearchedInput, parsedData, itemCount || parsedData.length);
            if (foundKeywordIndexes.length !== 0) {
                setSearchedWordIndexes(foundKeywordIndexes);
                scrollToRow(foundKeywordIndexes[constants_1.DEFAULT_SEARCH_INDEX]);
                setCurrentSearchedItemCount(constants_1.DEFAULT_INDEX);
            }
        }
        if (!adjustedSearchedInput) {
            setRowInFocus(defaultRowInFocus);
        }
    }, [searchedInput]);
    const hasFoundResults = searchedWordIndexes.length > 0 && ((_b = searchedWordIndexes[0]) === null || _b === void 0 ? void 0 : _b.rowIndex) !== -1;
    /* Clearing out the search input */
    const handleClear = () => {
        setSearchedInput('');
        setCurrentSearchedItemCount(constants_1.DEFAULT_INDEX);
        setSearchedWordIndexes([]);
        setRowInFocus(defaultRowInFocus);
    };
    /* Moving focus over to next row containing searched word */
    const handleNextSearchItem = () => {
        const adjustedSearchedItemCount = (currentSearchedItemCount + constants_1.NUMBER_INDEX_DELTA) % searchedWordIndexes.length;
        setCurrentSearchedItemCount(adjustedSearchedItemCount);
        scrollToRow(searchedWordIndexes[adjustedSearchedItemCount]);
    };
    /* Moving focus over to next row containing searched word */
    const handlePrevSearchItem = () => {
        let adjustedSearchedItemCount = currentSearchedItemCount - constants_1.NUMBER_INDEX_DELTA;
        if (adjustedSearchedItemCount < constants_1.DEFAULT_INDEX) {
            adjustedSearchedItemCount += searchedWordIndexes.length;
        }
        setCurrentSearchedItemCount(adjustedSearchedItemCount);
        scrollToRow(searchedWordIndexes[adjustedSearchedItemCount]);
    };
    return (react_1.default.createElement(react_core_1.SearchInput, Object.assign({ placeholder: placeholder, value: searchedInput, resultsCount: `${currentSearchedItemCount + indexAdjuster} / ${hasFoundResults ? searchedWordIndexes.length : 0}` }, props, { onChange: (event, input) => {
            props.onChange && props.onChange(event, input);
            setSearchedInput(input);
        }, onNextClick: event => {
            props.onNextClick && props.onNextClick(event);
            handleNextSearchItem();
        }, onPreviousClick: event => {
            props.onPreviousClick && props.onPreviousClick(event);
            handlePrevSearchItem();
        }, onClear: event => {
            props.onClear && props.onClear(event);
            handleClear();
        } })));
};
exports.LogViewerSearch = LogViewerSearch;
exports.LogViewerSearch.displayName = 'LogViewerSearch';
//# sourceMappingURL=LogViewerSearch.js.map