
/*
    ARES-6
    ACTION MANAGER

    Processes player decisions, resource changes
    and special gameplay effects.
*/

import { GAME_CONFIG } from "./gameState.js";

import { startCropCycle } from "../simulation/greenhouse.js";

import { setSolarDustLevel } from "../simulation/powerSystem.js";

import {
    allocateWaterForShielding
} from "../simulation/radiationSystem.js";

import { completeObjective } from "./objectiveManager.js";


// =====================================
// 1. VALID RESOURCES
// =====================================

const VALID_RESOURCES = [
    "power",
    "water",
    "food"
];


// =====================================
// 2. VALIDATE RESOURCE CHANGES
// =====================================

function validateResourceChanges(changes = {}) {

    if (
        typeof changes !== "object" ||
        changes === null ||
        Array.isArray(changes)
    ) {

        return {
            valid: false,
            message: "Invalid resource changes."
        };

    }

    for (const [resource, amount] of Object.entries(changes)) {

        if (!VALID_RESOURCES.includes(resource)) {

            return {
                valid: false,
                message: `Unknown resource: ${resource}`
            };

        }

        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount < 0
        ) {

            return {
                valid: false,
                message: `Invalid amount for ${resource}.`
            };

        }

    }

    return {
        valid: true,
        values: changes
    };

}


// =====================================
// 3. APPLY SPECIAL GAMEPLAY EFFECTS
// =====================================

function applyDecisionEffects(gameState, effects = {}) {

    if (
        typeof effects !== "object" ||
        effects === null ||
        Array.isArray(effects)
    ) {

        return {
            success: false,
            message: "Invalid decision effects."
        };

    }


    for (const [effect, value] of Object.entries(effects)) {

        let result;


        switch (effect) {

            // Start growing crops.
            case "startCropCycle":

                if (value !== true) {

                    return {
                        success: false,
                        message: "Invalid greenhouse instruction."
                    };

                }

                result = startCropCycle(gameState);

                break;


            // Change solar panel condition.
            case "setSolarDustLevel":

                result = setSolarDustLevel(gameState, value);

                break;


            // Complete a research objective.
            case "completeObjective":

                result = completeObjective(gameState, value);

                break;


            // Allocate water to radiation shielding.
            case "allocateWaterForShielding":

                if (value !== true) {

                    return {
                        success: false,
                        message: "Invalid shielding instruction."
                    };

                }

                result = allocateWaterForShielding(gameState);

                break;


            // Repair or change habitat condition.
            case "setHabitatOperational":

                if (
                    typeof value !== "boolean" ||
                    !gameState.facilities?.habitat
                ) {

                    return {
                        success: false,
                        message: "Invalid habitat instruction."
                    };

                }

                gameState.facilities.habitat.operational = value;

                result = {
                    success: true,
                    message: "Habitat condition updated."
                };

                break;


            // Reset air-system failure counter after repair.
            case "resetAirFailures":

                if (
                    value !== true ||
                    !gameState.systems
                ) {

                    return {
                        success: false,
                        message: "Invalid life-support instruction."
                    };

                }

                gameState.systems.airFailureSols = 0;

                gameState.systems.airStatus = "good";

                result = {
                    success: true,
                    message: "Air-system failures reset."
                };

                break;


            // Repair or disable the water recycler.
            case "setWaterRecyclerOperational":

                if (
                    typeof value !== "boolean" ||
                    !gameState.facilities?.waterRecycler
                ) {
                    return {
                        success: false,
                        message: "Invalid water recycler instruction."
                    };
                }

                gameState.facilities.waterRecycler.operational = value;

                result = {
                    success: true,
                    message: value
                        ? "Water recycler repaired."
                        : "Water recycler remains offline."
                };

                break;


            // Record the final mission report as transmitted to Earth.
            case "transmitFinalReport":

                if (
                    value !== true ||
                    !gameState.supportAssets?.antennaOperational ||
                    gameState.mission.finalReportTransmitted === true
                ) {
                    return {
                        success: false,
                        message: "The final report cannot be transmitted."
                    };
                }

                gameState.mission.finalReportTransmitted = true;

                result = {
                    success: true,
                    message: "The final research report was transmitted to Earth."
                };

                break;


            // Reject unknown instructions.
            default:

                return {
                    success: false,
                    message: `Unknown gameplay effect: ${effect}`
                };

        }


        // Stop if an effect could not be completed.
        if (!result.success) {

            return {

                success: false,

                message: result.message || "Decision effect failed."

            };

        }

    }


    return {
        success: true,
        message: "All decision effects applied."
    };

}


// =====================================
// 4. APPLY PLAYER DECISION
// =====================================

export function applyDecision(gameState, decision) {

    // Validate game state.
    if (
        !gameState ||
        !gameState.mission ||
        !gameState.resources ||
        !gameState.turn ||
        !Array.isArray(gameState.history)
    ) {

        return {
            success: false,
            message: "Game state is invalid."
        };

    }


    // Check whether mission is active.
    if (gameState.mission.status !== "playing") {

        return {
            success: false,
            message: "Mission is not active."
        };

    }


    // Prevent multiple decisions in one Sol.
    if (gameState.turn.decisionMade) {

        return {
            success: false,
            message: "You have already made today's decision."
        };

    }


    // Validate decision information.
    if (
        !decision ||
        typeof decision.id !== "string" ||
        decision.id.trim() === ""
    ) {

        return {
            success: false,
            message: "Invalid decision."
        };

    }


    // Validate resource costs.
    const costCheck = validateResourceChanges(decision.costs);

    if (!costCheck.valid) {
        return {
            success: false,
            message: costCheck.message
        };
    }


    // Validate resource gains.
    const gainCheck = validateResourceChanges(decision.gains);

    if (!gainCheck.valid) {
        return {
            success: false,
            message: gainCheck.message
        };
    }


    // Validate effects before making changes.
    const effects = decision.effects ?? {};

    if (
        typeof effects !== "object" ||
        effects === null ||
        Array.isArray(effects)
    ) {

        return {
            success: false,
            message: "Invalid decision effects."
        };

    }


    // Check current resource values.
    for (const resource of VALID_RESOURCES) {

        const currentValue = gameState.resources[resource];

        if (
            typeof currentValue !== "number" ||
            !Number.isFinite(currentValue) ||
            currentValue < 0 ||
            currentValue > GAME_CONFIG.maxResource
        ) {

            return {
                success: false,
                message: `Invalid current value for ${resource}.`
            };

        }


        const cost = costCheck.values[resource] ?? 0;

        if (currentValue < cost) {

            return {
                success: false,
                message: `Not enough ${resource}.`
            };

        }

    }


    // =====================================
    // 5. CREATE A TEMPORARY GAME STATE
    // =====================================

    let draftState;

    try {

        draftState = structuredClone(gameState);

    } catch (error) {

        return {
            success: false,
            message: "Could not create a temporary game state."
        };

    }


    const originalResources = {
        ...gameState.resources
    };


    // =====================================
    // 6. APPLY RESOURCE COSTS AND GAINS
    // =====================================

    for (const resource of VALID_RESOURCES) {

        const currentValue = draftState.resources[resource];

        const cost = costCheck.values[resource] ?? 0;

        const gain = gainCheck.values[resource] ?? 0;

        draftState.resources[resource] = Math.min(
            GAME_CONFIG.maxResource,
            currentValue - cost + gain
        );

    }


    // =====================================
    // 7. APPLY SPECIAL GAMEPLAY EFFECTS
    // =====================================

    const effectResult = applyDecisionEffects(
        draftState,
        effects
    );

    if (!effectResult.success) {

        return {
            success: false,
            message: effectResult.message
        };

    }


    // =====================================
    // 8. RECORD THE DECISION
    // =====================================

    draftState.turn.decisionMade = true;

    draftState.turn.selectedChoiceId = decision.id;


    // Calculate actual resource changes,
    // including costs from special effects.
    const resourceChanges = {};

    for (const resource of VALID_RESOURCES) {

        resourceChanges[resource] =
            draftState.resources[resource] -
            originalResources[resource];

    }


    const historyEntry = {

        sol: draftState.mission.currentSol,

        choiceId: decision.id,

        label: decision.label ?? decision.id,

        costs: {
            ...costCheck.values
        },

        gains: {
            ...gainCheck.values
        },

        resourceChanges: resourceChanges,

        explanation: decision.explanation ?? ""

    };


    draftState.history.push(historyEntry);


    // =====================================
    // 9. COMMIT THE TEMPORARY STATE
    // =====================================

    Object.assign(gameState, draftState);


    return {

        success: true,

        message: "Decision successfully applied.",

        changes: resourceChanges,

        historyEntry: historyEntry

    };

}
