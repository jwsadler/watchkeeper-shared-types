/**
 * Electronics/module details for digital watches.
 *
 * Unified superset of admin `ElectronicsInfo` and RN `ElectronicsReference`.
 */
export interface ElectronicsInfo {
  /** Module number (e.g., "3200") */
  module?: string;
  /** Display type (e.g., "Negative", "Positive") */
  display?: string;
  /** LCD type (e.g., "LCD", "STN") */
  lcdType?: string;
  /** Backlight type (e.g., "Electro Luminescence (EL)", "LED") */
  lightType?: string;
  /** Battery type (e.g., "CTL1616") */
  battery?: string;
  /** Battery life info (e.g., "Rechargeable") */
  batteryLife?: string;
  /** Timekeeping type (e.g., "Digital", "Analog") */
  timekeeping?: string;
}
