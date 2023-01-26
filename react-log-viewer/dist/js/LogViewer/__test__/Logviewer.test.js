"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
require("jest-canvas-mock");
const LogViewer_1 = require("../LogViewer");
const realTestData_1 = require("./realTestData");
test('Renders without children', () => {
    (0, react_2.render)(react_1.default.createElement("div", { "data-testid": "container" },
        react_1.default.createElement(LogViewer_1.LogViewer, { hasLineNumbers: false, height: 300, data: realTestData_1.data.data, theme: 'light' })));
    expect(react_2.screen.getByTestId('container').firstChild).toBeVisible();
});
//# sourceMappingURL=Logviewer.test.js.map