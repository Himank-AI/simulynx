import { CALIBRATION } from "@/data/calibration";
import type { CalibrationResult } from "@/types";

export const calibrationService = {
  get(): CalibrationResult {
    return CALIBRATION;
  },
};
