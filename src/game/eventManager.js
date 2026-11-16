
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

import { GAME_CONFIG } from "./gameState.js";


// =====================================
// 1. EVENT DATA CACHE
// =====================================

const EVENT_FILES = {
    standard: "/data/events.json",
    "may-2024-solar-storm": "/data/scenarios/may-2024-solar-storm.json"
};

const eventCache = new Map();


// =====================================
// 2. LOAD EVENTS FROM THE SELECTED SCENARIO
// =====================================

export async function loadEvents(scenarioId = "standard") {

    const filePath = EVENT_FILES[scenarioId];

    if (!filePath) {
        return {
            success: false,
            message: "Unknown mission scenario."
        };
    }

    if (eventCache.has(scenarioId)) {
        return {
            success: true,
            events: eventCache.get(scenarioId)
        };
    }

    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            return {
                success: false,
                message: `Could not load mission events: ${response.status}`
            };
        }

        const data = await response.json();

        if (
            !data ||
            !Array.isArray(data.events) ||
            data.events.length !== GAME_CONFIG.totalSols
        ) {
            return {
                success: false,
                message: "Invalid mission data. Fourteen events are required."
            };
        }

        if (
            scenarioId !== "standard" &&
            data.scenario?.id !== scenarioId
        ) {
            return {
                success: false,
                message: "The scenario information does not match the selected mission."
            };
        }

        const ids = new Set();
        const sols = new Set();

        for (const event of data.events) {
            if (
                !event ||
                typeof event.id !== "string" ||
                event.id.trim() === "" ||
                !Number.isInteger(event.sol) ||
                event.sol < 1 ||
                event.sol > GAME_CONFIG.totalSols ||
                ids.has(event.id) ||
                sols.has(event.sol) ||
                !Array.isArray(event.choices) ||
                event.choices.length !== 2
            ) {
                return {
                    success: false,
                    message: "Mission events contain invalid or duplicate entries."
                };
            }

            ids.add(event.id);
            sols.add(event.sol);
        }

        for (let sol = 1; sol <= GAME_CONFIG.totalSols; sol++) {
            if (!sols.has(sol)) {
                return {
                    success: false,
                    message: `Event for Mars day ${sol} is missing.`
                };
            }
        }

        const events = [...data.events].sort((a, b) => a.sol - b.sol);

        eventCache.set(scenarioId, events);

        return {
            success: true,
            events,
            scenario: data.scenario ?? null
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


            case "setWaterRecyclerOperational":

                if (
                    typeof value !== "boolean" ||
                    !draft.facilities?.waterRecycler
                ) {
                    return {
                        success: false,
                        message: "Invalid water recycler starting condition."
                    };
                }

                draft.facilities.waterRecycler.operational = value;

                result = {
                    success: true
                };

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
    const scenarioId = gameState.mission.scenarioId ?? "standard";
    const loadResult = await loadEvents(scenarioId);

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
