
/*
    ARES-6
    EVENT MANAGER

    Loads daily events and initializes their starting conditions.
*/

import {
    setSolarDustLevel
} from "../simulation/powerSystem.js";

import {
    setRadiationStatus
} from "../simulation/radiationSystem.js";


// =====================================
// 1. EVENT DATA CACHE
// =====================================

let cachedEvents = null;


// =====================================
// 2. LOAD EVENTS FROM JSON
// =====================================

export async function loadEvents() {

    // Reuse previously loaded event data.
    if (cachedEvents !== null) {

        return {
            success: true,
            events: cachedEvents
        };

    }


    try {

        const response = await fetch("/data/events.json");

        if (!response.ok) {

            return {
                success: false,
                message: `Could not load events: ${response.status}`
            };

        }


        const data = await response.json();


        if (
            !data ||
            !Array.isArray(data.events) ||
            data.events.length !== 7
        ) {

            return {
                success: false,
                message: "Invalid event data. Seven events are required."
            };

        }


        // Check event IDs and Sol numbers.
        const ids = new Set();
        const sols = new Set();

        for (const event of data.events) {

            if (
                !event ||
                typeof event.id !== "string" ||
                !Number.isInteger(event.sol) ||
                event.sol < 1 ||
                event.sol > 7 ||
                ids.has(event.id) ||
                sols.has(event.sol) ||
                !Array.isArray(event.choices) ||
                event.choices.length !== 2
            ) {

                return {
                    success: false,
                    message: "Event data contains invalid or duplicate entries."
                };

            }

            ids.add(event.id);
            sols.add(event.sol);

        }


        // Confirm all seven Sols exist.
        for (let sol = 1; sol <= 7; sol++) {

            if (!sols.has(sol)) {

                return {
                    success: false,
                    message: `Event for Sol ${sol} is missing.`
                };

            }

        }


        // Sort events into campaign order.
        cachedEvents = [...data.events].sort(
            (a, b) => a.sol - b.sol
        );


        return {
            success: true,
            events: cachedEvents
        };


    } catch (error) {

        console.error("Event loading error:", error);

        return {
            success: false,
            message: "Unable to load mission events."
        };

    }

}


// =====================================
// 3. APPLY EVENT STARTING CONDITIONS
// =====================================

function applyEventStartEffects(gameState, event) {

    const effects = event.onStart ?? {};


    if (
        typeof effects !== "object" ||
        effects === null ||
        Array.isArray(effects)
    ) {

        return {
            success: false,
            message: "Invalid event starting effects."
        };

    }


    // Work on a temporary copy.
    const draft = structuredClone(gameState);


    for (const [effect, value] of Object.entries(effects)) {

        let result;


        switch (effect) {

            case "setSolarDustLevel":

                result = setSolarDustLevel(draft, value);

                break;


            case "setRadiationStatus":

                result = setRadiationStatus(draft, value);

                break;


            case "setHabitatOperational":

                if (
                    typeof value !== "boolean" ||
                    !draft.facilities?.habitat
                ) {

                    return {
                        success: false,
                        message: "Invalid habitat starting condition."
                    };

                }

                draft.facilities.habitat.operational = value;

                result = {
                    success: true
                };

                break;


            default:

                return {
                    success: false,
                    message: `Unknown event starting effect: ${effect}`
                };

        }


        if (!result.success) {

            return {
                success: false,
                message: result.message
            };

        }

    }


    // Remember that this event has been initialized.
    draft.turn.currentEventId = event.id;


    // Apply all changes together.
    Object.assign(gameState, draft);


    return {
        success: true,
        message: "Event starting conditions applied."
    };

}


// =====================================
// 4. LOAD EVENT FOR CURRENT SOL
// =====================================

export async function loadEventForCurrentSol(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.turn ||
        gameState.mission.status !== "playing"
    ) {

        return {
            success: false,
            message: "Cannot load an event for an inactive mission."
        };

    }


    // Load the campaign events.
    const loadResult = await loadEvents();

    if (!loadResult.success) {

        return loadResult;

    }


    // Find the event matching the current Sol.
    const event = loadResult.events.find(
        item => item.sol === gameState.mission.currentSol
    );


    if (!event) {

        return {
            success: false,
            message: "No event exists for the current Sol."
        };

    }


    // Avoid applying starting effects more than once.
    if (gameState.turn.currentEventId === event.id) {

        return {
            success: true,
            event: event,
            alreadyInitialized: true,
            message: "This event is already initialized."
        };

    }


    // Apply starting effects.
    const startResult = applyEventStartEffects(
        gameState,
        event
    );


    if (!startResult.success) {

        return {
            success: false,
            message: startResult.message
        };

    }


    return {

        success: true,

        event: event,

        alreadyInitialized: false,

        message: "Daily event loaded successfully."

    };

}
