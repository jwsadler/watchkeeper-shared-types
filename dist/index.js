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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBrandManufacturerLinkAllowed = exports.WATCH_STORAGE_FIELD_KEYS = exports.STORAGE_LOCATION_CATEGORIES = void 0;
var StorageLocation_1 = require("./StorageLocation");
Object.defineProperty(exports, "STORAGE_LOCATION_CATEGORIES", { enumerable: true, get: function () { return StorageLocation_1.STORAGE_LOCATION_CATEGORIES; } });
var WatchStorageFields_1 = require("./WatchStorageFields");
Object.defineProperty(exports, "WATCH_STORAGE_FIELD_KEYS", { enumerable: true, get: function () { return WatchStorageFields_1.WATCH_STORAGE_FIELD_KEYS; } });
var derivationGate_1 = require("./derivationGate");
Object.defineProperty(exports, "isBrandManufacturerLinkAllowed", { enumerable: true, get: function () { return derivationGate_1.isBrandManufacturerLinkAllowed; } });
__exportStar(require("./Extraction"), exports);
//# sourceMappingURL=index.js.map