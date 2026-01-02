import pincodesData from '../data/pincodes.json';

interface PincodeData {
  pincode: string;
  state: string;
  city: string;
}

// Create a map for fast lookup by pincode
let pincodeMap: Map<string, PincodeData> | null = null;

/**
 * Initialize the pincode map from the JSON data
 */
function initializePincodeMap(): Map<string, PincodeData> {
  if (pincodeMap === null) {
    pincodeMap = new Map();
    const pincodes = pincodesData as PincodeData[];
    pincodes.forEach((item) => {
      pincodeMap!.set(item.pincode, item);
    });
  }
  return pincodeMap;
}

/**
 * Look up city and state by pincode
 * @param pincode - The pincode to look up (can be string or number)
 * @returns Object with city and state, or null if not found
 */
export function lookupPincode(pincode: string | number): { city: string; state: string } | null {
  if (!pincode) return null;
  
  const pincodeStr = String(pincode).trim();
  if (pincodeStr.length !== 6) return null;
  
  const map = initializePincodeMap();
  const data = map.get(pincodeStr);
  
  if (data) {
    return {
      city: data.city,
      state: data.state,
    };
  }
  
  return null;
}

/**
 * Check if a pincode exists in the database
 * @param pincode - The pincode to check
 * @returns true if pincode exists, false otherwise
 */
export function isValidPincode(pincode: string | number): boolean {
  return lookupPincode(pincode) !== null;
}

