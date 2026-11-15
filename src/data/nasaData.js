
/*
    ARES-6
    NASA DATA MANAGER

    Loads, validates and provides NASA datasets.
*/

import {
    validateMarsRadiationData,
    validateSourcesData,
    validateSourceReferences
} from "./dataValidator.js";

import {
    getCachedData,
    setCachedData,
    clearCachedData
} from "./dataCache.js";


// =====================================
// 1. DATASET CONFIGURATION
// =====================================

const DATASETS = {

    radiation: {
        url: "/data/mars-radiation.json",
        cacheKey: "ares6-mars-radiation"
    },

    sources: {
        url: "/data/sources.json",
        cacheKey: "ares6-nasa-sources"
    }

};


// =====================================
// 2. LOAD JSON FILE
// =====================================

async function fetchLocalJSON(dataset) {

    // Check whether data is already cached.
    const cached = getCachedData(dataset.cacheKey);

    if (cached !== null) {

        return {

            success: true,

            data: cached,

            fromCache: true

        };

    }


    // Request the local JSON file.
    const response = await fetch(dataset.url);


    if (!response.ok) {

        throw new Error(
            `Failed to load ${dataset.url}: HTTP ${response.status}`
        );

    }


    // Convert response into JavaScript data.
    const data = await response.json();


    return {

        success: true,

        data: data,

        fromCache: false

    };

}


// =====================================
// 3. LOAD ALL NASA DATA
// =====================================

export async function loadNASAData() {

    try {

        // Load both datasets.
        const [radiationResult, sourcesResult] =
            await Promise.all([

                fetchLocalJSON(DATASETS.radiation),

                fetchLocalJSON(DATASETS.sources)

            ]);


        const radiationData = radiationResult.data;

        const sourcesData = sourcesResult.data;


        // =====================================
        // 4. VALIDATE RADIATION DATA
        // =====================================

        const radiationValidation =
            validateMarsRadiationData(radiationData);


        if (!radiationValidation.valid) {

            clearCachedData(DATASETS.radiation.cacheKey);

            return {

                success: false,

                message: "NASA radiation data is invalid.",

                errors: radiationValidation.errors

            };

        }


        // =====================================
        // 5. VALIDATE SOURCE DATA
        // =====================================

        const sourceValidation =
            validateSourcesData(sourcesData);


        if (!sourceValidation.valid) {

            clearCachedData(DATASETS.radiation.cacheKey);

            clearCachedData(DATASETS.sources.cacheKey);

            return {

                success: false,

                message: "NASA source data is invalid.",

                errors: sourceValidation.errors

            };

        }


        // =====================================
        // 6. VERIFY SOURCE REFERENCES
        // =====================================

        const referenceValidation =
            validateSourceReferences(
                radiationData,
                sourcesData
            );


        if (!referenceValidation.valid) {

            clearCachedData(DATASETS.radiation.cacheKey);

            clearCachedData(DATASETS.sources.cacheKey);

            return {

                success: false,

                message: referenceValidation.message,

                missingSources: referenceValidation.missingSources

            };

        }


        // =====================================
        // 7. CACHE VALIDATED DATA
        // =====================================

        if (!radiationResult.fromCache) {

            setCachedData(
                DATASETS.radiation.cacheKey,
                radiationData
            );

        }


        if (!sourcesResult.fromCache) {

            setCachedData(
                DATASETS.sources.cacheKey,
                sourcesData
            );

        }


        // =====================================
        // 8. RETURN NASA DATA
        // =====================================

        return {

            success: true,

            dataType: "historical",

            radiation: radiationData,

            sources: sourcesData.sources,

            fromCache:
                radiationResult.fromCache &&
                sourcesResult.fromCache,

            message: "NASA datasets loaded and validated."

        };


    } catch (error) {

        console.error("NASA data loading error:", error);


        return {

            success: false,

            message: error.message ||
                "Unable to load NASA datasets."

        };

    }

}


// =====================================
// 9. LOOK UP SOURCE BY ID
// =====================================

export function findNASASource(sources, sourceId) {

    if (!Array.isArray(sources)) {

        return null;

    }


    return sources.find(
        source => source.id === sourceId
    ) ?? null;

}
