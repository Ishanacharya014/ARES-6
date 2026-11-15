
/*
    ARES-6
    NASA DONKI API

    Retrieves recent Solar Energetic Particle notifications.

    This is space-weather context, NOT a Mars radiation-dose
    measurement or prediction.
*/

import {
    getCachedData,
    setCachedData,
    clearCachedData
} from "./dataCache.js";


// =====================================
// 1. API CONFIGURATION
// =====================================

const DONKI_API_URL =
    "https://ccmc.gsfc.nasa.gov/DONKI-API/get/notifications";

const CACHE_KEY = "ares6-donki-sep-notifications";

const CACHE_DURATION = 30 * 60 * 1000;

const REQUEST_TIMEOUT = 12000;


// =====================================
// 2. FORMAT UTC DATE
// =====================================

function formatUTCDate(date) {

    return date.toISOString().slice(0, 10);

}


// =====================================
// 3. NORMALIZE DONKI NOTIFICATIONS
// =====================================

function normalizeNotifications(data) {

    if (!Array.isArray(data)) {

        throw new Error("Invalid DONKI response format.");

    }


    return data
        .filter(item => {

            return (
                item &&
                typeof item === "object" &&
                item.messageType === "SEP" &&
                typeof item.messageBody === "string"
            );

        })
        .map((item, index) => ({

            id: item.messageID ||
                `sep-notification-${index}`,

            type: item.messageType,

            issueTime: item.messageIssueTime || null,

            message: item.messageBody,

            url:
                typeof item.messageURL === "string" &&
                /^https:\/\//i.test(item.messageURL)
                    ? item.messageURL
                    : null

        }));

}


// =====================================
// 4. FETCH RECENT DONKI DATA
// =====================================

export async function fetchRecentSEPNotifications({
    days = 7,
    forceRefresh = false
} = {}) {

    // Validate requested date range.
    if (
        !Number.isInteger(days) ||
        days < 1 ||
        days > 30
    ) {

        return {

            success: false,

            message: "DONKI date range must be between 1 and 30 days."

        };

    }


    const endDate = formatUTCDate(new Date());


    const start = new Date();

    start.setUTCDate(start.getUTCDate() - (days - 1));

    const startDate = formatUTCDate(start);


    // =====================================
    // 5. CHECK CACHE
    // =====================================

    const cached = getCachedData(CACHE_KEY);


    if (!forceRefresh && cached) {

        const cacheAge =
            Date.now() - Date.parse(cached.fetchedAt);


        if (
            Number.isFinite(cacheAge) &&
            cacheAge >= 0 &&
            cacheAge < CACHE_DURATION &&
            cached.startDate === startDate &&
            cached.endDate === endDate
        ) {

            return {

                ...cached,

                fromCache: true

            };

        }

        clearCachedData(CACHE_KEY);

    }


    // =====================================
    // 6. CREATE API REQUEST
    // =====================================

    const url = new URL(DONKI_API_URL);

    url.searchParams.set("startDate", startDate);

    url.searchParams.set("endDate", endDate);

    url.searchParams.set("type", "SEP");


    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT
    );


    try {

        const response = await fetch(url.toString(), {

            method: "GET",

            headers: {
                "Accept": "application/json"
            },

            signal: controller.signal

        });


        if (!response.ok) {

            throw new Error(
                `DONKI request failed: HTTP ${response.status}`
            );

        }


        // Parse API response.
        const rawData = await response.json();


        // Normalize notifications.
        const notifications =
            normalizeNotifications(rawData);


        // =====================================
        // 7. PREPARE RESULT
        // =====================================

        const result = {

            success: true,

            source: "NASA CCMC DONKI",

            dataType: "near-real-time-space-weather",

            notificationType: "SEP",

            startDate: startDate,

            endDate: endDate,

            fetchedAt: new Date().toISOString(),

            fromCache: false,

            notifications: notifications,

            message:
                notifications.length > 0
                    ? "Recent SEP notifications retrieved."
                    : "No SEP notifications returned for this date range."

        };


        // =====================================
        // 8. CACHE SUCCESSFUL RESULT
        // =====================================

        setCachedData(CACHE_KEY, result);


        return result;


    } catch (error) {

        clearCachedData(CACHE_KEY);


        console.error("DONKI API error:", error);


        return {

            success: false,

            source: "NASA CCMC DONKI",

            message: error.name === "AbortError"
                ? "DONKI request timed out."
                : error.message || "Unable to retrieve DONKI data."

        };

    } finally {

        clearTimeout(timeout);

    }

}


// =====================================
// 9. CLEAR DONKI CACHE
// =====================================

export function clearDONKICache() {

    clearCachedData(CACHE_KEY);

}
