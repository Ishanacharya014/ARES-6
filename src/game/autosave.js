/*
    ARES-6
    LOCAL AUTOSAVE

    Stores only validated mission state in this browser.
    No player account or server connection is required.
*/

import { GAME_CONFIG } from "./gameState.js";

export const AUTOSAVE_KEY = "ares6-autosave-v1";
export const AUTOSAVE_VERSION = 1;

const VALID_SCENARIOS = new Set([
    "standard",
    "may-2024-solar-storm"
]);

const VALID_MISSION_STATUSES = new Set([
    "playing",
    "success",
    "partial-success",
    "failure"
]);

const VALID_CREW_CONDITIONS = new Set([
    "healthy",
    "needs-attention",
    "critical"
]);

const VALID_AIR_STATUSES = new Set([
    "good",
    "needs-attention",
    "critical"
]);

const VALID_RADIATION_STATUSES = new Set([
    "safe",
    "caution",
    "danger"
]);

const OBJECTIVE_KEYS = [
    "geologicalResearch",
    "environmentalResearch",
    "waterIceResearch",
    "atmosphericResearch"
];

function isRecord(value) {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isIntegerInRange(value, min, max) {
    return Number.isInteger(value) && value >= min && value <= max;
}

function isPowerAllocation(value) {
    if (!isRecord(value)) return false;

    const validAmounts = [0, 2];

    return (
        validAmounts.includes(value.greenhouse) &&
        validAmounts.includes(value.rover) &&
        validAmounts.includes(value.shelter) &&
        typeof value.confirmed === "boolean" &&
        (
            value.total === undefined ||
            isIntegerInRange(value.total, 0, 6)
        )
    );
}


// =====================================
// VALIDATE SAVED GAME STATE
// =====================================

export function validateSavedGameState(state) {

    if (!isRecord(state)) return false;

    const mission = state.mission;
    const crew = state.crew;
    const resources = state.resources;
    const systems = state.systems;
    const facilities = state.facilities;
    const turn = state.turn;
    const objectives = state.objectives;
    const communication = state.communication;

    if (
        !isRecord(mission) ||
        !isRecord(crew) ||
        !isRecord(resources) ||
        !isRecord(systems) ||
        !isRecord(facilities) ||
        !isRecord(turn) ||
        !isRecord(objectives) ||
        !isRecord(communication) ||
        !isRecord(state.supportAssets) ||
        !Array.isArray(state.history)
    ) {
        return false;
    }

    if (
        !VALID_SCENARIOS.has(mission.scenarioId) ||
        !VALID_MISSION_STATUSES.has(mission.status) ||
        mission.totalSols !== GAME_CONFIG.totalSols ||
        !isIntegerInRange(mission.currentSol, 1, GAME_CONFIG.totalSols) ||
        typeof mission.powerPlanningEnabled !== "boolean" ||
        typeof mission.finalReportTransmitted !== "boolean"
    ) {
        return false;
    }

    if (
        !isIntegerInRange(crew.count, 1, GAME_CONFIG.crewCount) ||
        !VALID_CREW_CONDITIONS.has(crew.condition) ||
        !isIntegerInRange(crew.supplyShortageSols, 0, 100) ||
        !isIntegerInRange(crew.radiationRiskPoints, 0, 10000)
    ) {
        return false;
    }

    for (const key of ["power", "water", "food"]) {
        if (!isIntegerInRange(resources[key], 0, GAME_CONFIG.maxResource)) {
            return false;
        }
    }

    if (
        !VALID_AIR_STATUSES.has(systems.airStatus) ||
        !VALID_RADIATION_STATUSES.has(systems.radiationStatus) ||
        !isIntegerInRange(systems.airFailureSols, 0, 100) ||
        !isIntegerInRange(systems.scienceInsightPoints, 0, 10000)
    ) {
        return false;
    }

    if (
        !isRecord(facilities.habitat) ||
        typeof facilities.habitat.operational !== "boolean" ||
        !isRecord(facilities.solarArray) ||
        !["clean", "dusty"].includes(facilities.solarArray.dustLevel) ||
        !isRecord(facilities.greenhouse) ||
        !["empty", "growing", "ready"].includes(facilities.greenhouse.cropStatus) ||
        !isIntegerInRange(facilities.greenhouse.solsUntilHarvest, 0, 100) ||
        !isIntegerInRange(facilities.greenhouse.totalHarvests, 0, 1000) ||
        !isIntegerInRange(facilities.greenhouse.nextHarvestBonus ?? 0, 0, 100) ||
        !isRecord(facilities.shelter) ||
        !["none", "basic"].includes(facilities.shelter.shieldingLevel) ||
        !isIntegerInRange(facilities.shelter.waterAllocated, 0, GAME_CONFIG.maxResource) ||
        !isRecord(facilities.waterRecycler) ||
        typeof facilities.waterRecycler.operational !== "boolean"
    ) {
        return false;
    }

    if (
        typeof state.supportAssets.antennaOperational !== "boolean" ||
        typeof state.supportAssets.roverAvailable !== "boolean"
    ) {
        return false;
    }

    if (
        typeof turn.decisionMade !== "boolean" ||
        !(
            turn.selectedChoiceId === null ||
            typeof turn.selectedChoiceId === "string"
        ) ||
        !(
            turn.currentEventId === null ||
            typeof turn.currentEventId === "string"
        ) ||
        !isPowerAllocation(turn.powerAllocation)
    ) {
        return false;
    }

    for (const key of OBJECTIVE_KEYS) {
        if (typeof objectives[key] !== "boolean") return false;
    }

    if (
        !(
            communication.pendingReply === null ||
            isRecord(communication.pendingReply)
        ) ||
        !Array.isArray(communication.receivedMessages)
    ) {
        return false;
    }

    // A playing save must not point past the end of the campaign.
    if (
        mission.status === "playing" &&
        mission.currentSol > mission.totalSols
    ) {
        return false;
    }

    return true;
}


// =====================================
// SAVE / LOAD / CLEAR
// =====================================

export function saveAutosave(gameState) {

    if (!validateSavedGameState(gameState)) {
        return {
            success: false,
            message: "The current mission state could not be validated."
        };
    }

    try {
        const record = {
            version: AUTOSAVE_VERSION,
            savedAt: new Date().toISOString(),
            gameState: JSON.parse(JSON.stringify(gameState))
        };

        window.localStorage.setItem(
            AUTOSAVE_KEY,
            JSON.stringify(record)
        );

        return {
            success: true,
            savedAt: record.savedAt,
            message: "Mission autosaved."
        };

    } catch (error) {
        console.warn("ARES-6 autosave failed:", error);

        return {
            success: false,
            message: "Autosave is unavailable in this browser."
        };
    }
}

export function readAutosave() {

    let raw;

    try {
        raw = window.localStorage.getItem(AUTOSAVE_KEY);
    } catch (error) {
        console.warn("ARES-6 save could not be read:", error);
        return {
            status: "unavailable",
            message: "This browser does not allow local saves."
        };
    }

    if (!raw) {
        return { status: "empty" };
    }

    try {
        const record = JSON.parse(raw);

        if (
            !isRecord(record) ||
            record.version !== AUTOSAVE_VERSION ||
            typeof record.savedAt !== "string" ||
            Number.isNaN(Date.parse(record.savedAt)) ||
            !validateSavedGameState(record.gameState)
        ) {
            return {
                status: "invalid",
                message: "The saved mission is damaged or belongs to an older version."
            };
        }

        return {
            status: "valid",
            savedAt: record.savedAt,
            gameState: record.gameState
        };

    } catch (error) {
        console.warn("ARES-6 save is not readable:", error);

        return {
            status: "invalid",
            message: "The saved mission could not be read."
        };
    }
}

export function clearAutosave() {

    try {
        window.localStorage.removeItem(AUTOSAVE_KEY);
        return { success: true };
    } catch (error) {
        console.warn("ARES-6 save could not be cleared:", error);
        return {
            success: false,
            message: "The previous save could not be removed."
        };
    }
}
