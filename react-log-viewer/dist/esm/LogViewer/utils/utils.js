export const isArrayOfString = (array) => {
    for (const str in array) {
        if (typeof str !== 'string') {
            return false;
        }
    }
    return true;
};
/*
  Function responsible for searching throughout logger component, need to setup for proper use anywhere.
  It should take an array, and return an array of indexes where the searchedInput is found throughout the data array.
  Should always be searching an array of strings. Look into lazy log for ideas.
*/
export const searchForKeyword = (searchedInput, parsedData, itemCount) => {
    const searchResults = [];
    const regex = new RegExp(searchedInput, 'ig');
    parsedData.map((row, index) => {
        const rawRow = stripAnsi(row);
        if (regex.test(rawRow) && index < itemCount) {
            const numMatches = rawRow.match(regex).length;
            for (let i = 1; i <= numMatches; i++) {
                searchResults.push({ rowIndex: index, matchIndex: i });
            }
        }
    });
    if (searchResults.length > 0) {
        return [...searchResults];
    }
    else if (searchResults.length <= 0) {
        return [{ rowIndex: -1, matchIndex: 0 }];
    }
};
export const parseConsoleOutput = (data) => {
    const stringToSplitWith = '\n';
    const parsedData = Array.isArray(data) ? data.join(stringToSplitWith) : data;
    const stringSplitting = parsedData.toString();
    const cleanString = stringSplitting.split(stringToSplitWith);
    return cleanString;
};
export const escapeString = (inputString) => inputString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // eslint-disable-line
/* eslint-disable-next-line no-control-regex */
const ansiRegexString = `[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]`;
export const ansiRegex = new RegExp(ansiRegexString, 'g');
export const isAnsi = (inputString) => inputString.match(ansiRegex);
export const stripAnsi = (inputString) => inputString.replace(ansiRegex, '');
export const splitAnsi = (inputString) => inputString.split(new RegExp(`(${ansiRegexString})`, 'g'));
export const escapeTextForHtml = (inputString) => inputString.replace(/[&<>"']/gm, str => {
    if (str === '&') {
        return '&amp;';
    }
    if (str === '<') {
        return '&lt;';
    }
    if (str === '>') {
        return '&gt;';
    }
    if (str === '"') {
        return '&quot;';
    }
    if (str === "'") {
        return '&#x27;';
    }
});
//# sourceMappingURL=utils.js.map