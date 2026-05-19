// Rules mapping serviceId to mandatory providerIds
export const MANDATORY_RULES: Record<number, number[]> = {
  1: [1],       // Service 1 -> Provider 1
  2: [5],       // Service 2 -> Provider 5
  3: [1, 4],    // Service 3 -> Provider 1 AND Provider 4
};

// Each lead must have exactly 3 assignments
export const TARGET_ASSIGNMENTS = 3;

// Max quota per provider
export const MAX_QUOTA = 10;
