
/*
    ARES-6
    DATA CACHE

    Stores validated NASA data during the current browser session.
*/


// =====================================
// 1. CREATE CACHE STORAGE
// =====================================

const cache = new Map();


// =====================================
// 2. SAFELY COPY JSON DATA
// =====================================

function cloneData(data) {

    if (typeof structuredClone === "function") {

        return structuredClone(data);

    }

    // Fallback for JSON-compatible data.
    return JSON.parse(JSON.stringify(data));

}


// =====================================
// 3. GET CACHED DATA
// =====================================

export function getCachedData(key) {

    if (!cache.has(key)) {

        return null;

    }

    return cloneData(cache.get(key));

}


// =====================================
// 4. STORE CACHED DATA
// =====================================

export function setCachedData(key, data) {

    if (
        typeof key !== "string" ||
        key.trim() === ""
    ) {

        throw new Error("Invalid cache key.");

    }

    cache.set(key, cloneData(data));

}


// =====================================
// 5. CLEAR CACHED DATA
// =====================================

export function clearCachedData(key) {

    cache.delete(key);

}


// =====================================
// 6. CLEAR COMPLETE CACHE
// =====================================

export function clearAllCachedData() {

    cache.clear();

}


// =====================================
// 7. CHECK CACHE
// =====================================

export function hasCachedData(key) {

    return cache.has(key);

}
