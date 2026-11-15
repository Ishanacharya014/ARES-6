
/*
    ARES-6
    DATA VALIDATOR

    Validates NASA datasets and their source references.
*/


// =====================================
// 1. BASIC VALIDATION
// =====================================

function isObject(value) {

    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );

}


// =====================================
// 2. VALIDATE MARS RADIATION DATA
// =====================================

export function validateMarsRadiationData(data) {

    const errors = [];


    if (!isObject(data)) {

        return {
            valid: false,
            errors: ["Radiation dataset must be an object."]
        };

    }


    // Validate dataset information.
    if (!isObject(data.dataset)) {

        errors.push("Dataset information is missing.");

    } else {

        if (
            data.dataset.id !==
            "MSL-M-RAD-3-RDR-V1.0"
        ) {

            errors.push("Unexpected radiation dataset ID.");

        }

        if (data.dataset.target !== "Mars") {

            errors.push("Dataset target must be Mars.");

        }

        if (data.dataset.instrument !== "RAD") {

            errors.push("Expected the RAD instrument.");

        }

    }


    // Validate observations.
    if (
        !Array.isArray(data.observations) ||
        data.observations.length === 0
    ) {

        errors.push("No radiation observations found.");

    } else {

        const observationIds = new Set();

        data.observations.forEach((observation, index) => {

            if (!isObject(observation)) {

                errors.push(
                    `Observation ${index + 1} is invalid.`
                );

                return;

            }


            if (
                typeof observation.id !== "string" ||
                observation.id.trim() === "" ||
                observationIds.has(observation.id)
            ) {

                errors.push(
                    `Observation ${index + 1} has an invalid or duplicate ID.`
                );

            } else {

                observationIds.add(observation.id);

            }


            if (
                typeof observation.name !== "string" ||
                observation.name.trim() === ""
            ) {

                errors.push(
                    `Observation ${index + 1} has no name.`
                );

            }


            if (
                typeof observation.value !== "number" ||
                !Number.isFinite(observation.value) ||
                observation.value < 0
            ) {

                errors.push(
                    `Observation ${index + 1} has an invalid value.`
                );

            }


            if (
                observation.unit !== "microgray per day" ||
                observation.unitSymbol !== "µGy/day"
            ) {

                errors.push(
                    `Observation ${index + 1} has an unexpected unit.`
                );

            }


            if (
                typeof observation.description !== "string" ||
                observation.description.trim() === ""
            ) {

                errors.push(
                    `Observation ${index + 1} has no description.`
                );

            }

        });

    }


    // Validate observed features.
    if (!Array.isArray(data.observedFeatures)) {

        errors.push("Observed features must be an array.");

    }


    // Validate limitations.
    if (
        !Array.isArray(data.limitations) ||
        data.limitations.length === 0
    ) {

        errors.push("Dataset limitations are missing.");

    }


    // Validate source IDs.
    if (
        !Array.isArray(data.sourceIds) ||
        data.sourceIds.length === 0 ||
        !data.sourceIds.every(
            id => typeof id === "string" && id.trim() !== ""
        )
    ) {

        errors.push("Dataset source references are invalid.");

    }


    return {

        valid: errors.length === 0,

        errors: errors

    };

}


// =====================================
// 3. VALIDATE SOURCE DATA
// =====================================

export function validateSourcesData(data) {

    const errors = [];


    if (!isObject(data)) {

        return {
            valid: false,
            errors: ["Source data must be an object."]
        };

    }


    if (!Array.isArray(data.sources) || data.sources.length === 0) {

        return {
            valid: false,
            errors: ["No source records found."]
        };

    }


    const sourceIds = new Set();


    data.sources.forEach((source, index) => {

        if (!isObject(source)) {

            errors.push(`Source ${index + 1} is invalid.`);

            return;

        }


        if (
            typeof source.id !== "string" ||
            source.id.trim() === "" ||
            sourceIds.has(source.id)
        ) {

            errors.push(
                `Source ${index + 1} has an invalid or duplicate ID.`
            );

        } else {

            sourceIds.add(source.id);

        }


        if (
            typeof source.title !== "string" ||
            source.title.trim() === ""
        ) {

            errors.push(
                `Source ${index + 1} has no title.`
            );

        }


        if (
            typeof source.url !== "string" ||
            !/^https:\/\//i.test(source.url)
        ) {

            errors.push(
                `Source ${index + 1} has an invalid HTTPS URL.`
            );

        }


        if (
            typeof source.agency !== "string" ||
            source.agency.trim() === ""
        ) {

            errors.push(
                `Source ${index + 1} has no agency.`
            );

        }

    });


    return {

        valid: errors.length === 0,

        errors: errors

    };

}


// =====================================
// 4. VALIDATE SOURCE REFERENCES
// =====================================

export function validateSourceReferences(
    radiationData,
    sourcesData
) {

    const availableSourceIds = new Set(
        sourcesData.sources.map(source => source.id)
    );


    const missingSources =
        radiationData.sourceIds.filter(
            id => !availableSourceIds.has(id)
        );


    return {

        valid: missingSources.length === 0,

        missingSources: missingSources,

        message: missingSources.length === 0
            ? "All NASA source references are valid."
            : "Some NASA source references are missing."

    };

}
