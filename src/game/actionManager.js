
/*
    ARES-6
    ACTION MANAGER

    Processes the player's daily decisions.
*/

import { GAME_CONFIG } from "./gameState.js";


// Resources that the player can manage.
const VALID_RESOURCES = ["power", "water", "food"];


// =====================================
// 1. VALIDATE RESOURCE CHANGES
// =====================================

function validateResourceChanges(changes) {

    // No changes are allowed if the format is invalid.
    if (
        changes === undefined ||
        changes === null
    ) {
        return {
            valid: true,
            values: {}
        };
    }

    if (
        typeof changes !== "object" ||
        Array.isArray(changes)
    ) {
        return {
            valid: false,
            message: "Invalid resource changes."
        };
    }

    for (const [resource, amount] of Object.entries(changes)) {

        // Check whether the resource exists.
        if (!VALID_RESOURCES.includes(resource)) {

            return {
                valid: false,
                message: `Unknown resource: ${resource}`
            };

        }

        // Costs and gains must be non-negative numbers.
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
// 2. APPLY A PLAYER DECISION
// =====================================

export function applyDecision(gameState, decision) {

    // Check the game state.
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


    // Check whether the mission is active.
    if (gameState.mission.status !== "playing") {

        return {
            success: false,
            message: "The mission is not active."
        };

    }


    // Check whether a decision has already been made.
    if (gameState.turn.decisionMade) {

        return {
            success: false,
            message: "You have already made today's decision."
        };

    }


    // Check the decision information.
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


    // Validate costs.
    const costCheck = validateResourceChanges(decision.costs);

    if (!costCheck.valid) {

        return {
            success: false,
            message: costCheck.message
        };

    }


    // Validate gains.
    const gainCheck = validateResourceChanges(decision.gains);

    if (!gainCheck.valid) {

        return {
            success: false,
            message: gainCheck.message
        };

    }


    const costs = costCheck.values;
    const gains = gainCheck.values;


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


        // Check whether the player can afford the decision.
        const cost = costs[resource] ?? 0;

        if (currentValue < cost) {

            return {
                success: false,
                message: `Not enough ${resource}.`
            };

        }

    }


    // =====================================
    // 3. CALCULATE NEW RESOURCE VALUES
    // =====================================

    const newResources = {};

    const changes = {};

    for (const resource of VALID_RESOURCES) {

        const currentValue = gameState.resources[resource];

        const cost = costs[resource] ?? 0;

        const gain = gains[resource] ?? 0;

        const newValue = Math.min(
            GAME_CONFIG.maxResource,
            currentValue - cost + gain
        );

        newResources[resource] = newValue;

        changes[resource] = newValue - currentValue;

    }


    // =====================================
    // 4. UPDATE THE GAME STATE
    // =====================================

    gameState.resources = {
        ...newResources
    };


    // Record that today's decision is complete.
    gameState.turn.decisionMade = true;

    gameState.turn.selectedChoiceId = decision.id;


    // =====================================
    // 5. SAVE THE DECISION IN HISTORY
    // =====================================

    const historyEntry = {

        sol: gameState.mission.currentSol,

        choiceId: decision.id,

        label: decision.label ?? decision.id,

        costs: {
            ...costs
        },

        gains: {
            ...gains
        },

        explanation: decision.explanation ?? ""

    };

    gameState.history.push(historyEntry);


    // =====================================
    // 6. RETURN THE RESULT
    // =====================================

    return {

        success: true,

        message: "Decision successfully applied.",

        changes: changes,

        historyEntry: historyEntry

    };

}
