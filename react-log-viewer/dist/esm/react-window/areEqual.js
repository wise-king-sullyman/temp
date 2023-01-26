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
import shallowDiffers from './shallowDiffers';
// Custom comparison function for React.memo().
// It knows to compare individual style props and ignore the wrapper object.
// See https://reactjs.org/docs/react-api.html#reactmemo
export function areEqual(prevProps, nextProps) {
    const { style: prevStyle } = prevProps, prevRest = __rest(prevProps, ["style"]);
    const { style: nextStyle } = nextProps, nextRest = __rest(nextProps, ["style"]);
    return !shallowDiffers(prevStyle, nextStyle) && !shallowDiffers(prevRest, nextRest);
}
//# sourceMappingURL=areEqual.js.map