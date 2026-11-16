/*
    ARES-6
    DAILY POWER ALLOCATION

    Optional advanced planning for players who want more control.
    Each selected system receives 2 power units for a specific benefit.
*/

import { GAME_CONFIG } from "./gameState.js";
import { getSolarGeneration } from "../simulation/powerSystem.js";

export const POWER_ALLOCATION_CONFIG = {
    powerPerSystem: 2,
    maxDailyAllocation: 6,
    lifeSupportReserve: 4
};

const ALLOCATION_TYPES = ["greenhouse", "rover", "shelter"];

function emptyAllocation() {
    return {
        greenhouse: 0,
        rover: 0,
        shelter: 0,
        confirmed: false
    };
}


// =====================================
// AVAILABLE DAILY POWER BUDGET
// =====================================

export function getAvailablePowerBudget(gameState) {

    if (!gameState?.resources || !gameState?.facilities) {
        return 0;
    }

    const currentPower = gameState.resources.power;

    if (!Number.isFinite(currentPower) || currentPower < 0) {
        return 0;
    }

    // Estimate the power reserve after today's solar generation.
    const generated = getSolarGeneration(gameState);
    const projectedPower = Math.min(
        GAME_CONFIG.maxResource,
        currentPower + generated
    );

    // Four units are kept aside for the automatic life-support system.
    const available = projectedPower -
        POWER_ALLOCATION_CONFIG.lifeSupportReserve;

    return Math.max(
        0,
        Math.min(POWER_ALLOCATION_CONFIG.maxDailyAllocation, available)
    );
}


// =====================================
// SAVE THE PLAYER'S DAILY POWER PLAN
// =====================================

export function saveDailyPowerAllocation(gameState, allocation = {}) {

    if (
        !gameState?.mission ||
        !gameState?.turn ||
        gameState.mission.status !== "playing"
    ) {
        return {
            success: false,
            message: "The mission is not active."
        };
    }

    if (gameState.mission.powerPlanningEnabled !== true) {
        return {
            success: false,
            message: "Advanced power planning is turned off."
        };
    }

    if (!gameState.turn.decisionMade) {
        return {
            success: false,
            message: "Choose today's mission action before planning extra power."
        };
    }

    const cleanAllocation = {};

    for (const type of ALLOCATION_TYPES) {
        const amount = allocation[type] ?? 0;

        if (
            !Number.isInteger(amount) ||
            ![0, POWER_ALLOCATION_CONFIG.powerPerSystem].includes(amount)
        ) {
            return {
                success: false,
                message: "Choose either 0 or 2 power units for each system."
            };
        }

        cleanAllocation[type] = amount;
    }

    if (
        cleanAllocation.greenhouse === 2 &&
        (
            gameState.facilities?.greenhouse?.cropStatus !== "growing" ||
            gameState.facilities.greenhouse.cropStartedSol >= gameState.mission.currentSol
        )
    ) {
        return {
            success: false,
            message: "Greenhouse boost is available after crops have started growing."
        };
    }

    if (
        cleanAllocation.rover === 2 &&
        gameState.supportAssets?.roverAvailable !== true
    ) {
        return {
            success: false,
            message: "The science rover is not available."
        };
    }

    if (
        cleanAllocation.shelter === 2 &&
        !["danger", "caution"].includes(gameState.systems?.radiationStatus)
    ) {
        return {
            success: false,
            message: "Shelter power is only useful during a radiation warning."
        };
    }

    const total = ALLOCATION_TYPES.reduce(
        (sum, type) => sum + cleanAllocation[type],
        0
    );

    const budget = getAvailablePowerBudget(gameState);

    if (total > budget) {
        return {
            success: false,
            message: `Your plan uses ${total} units, but only ${budget} extra power units are available today.`
        };
    }

    gameState.turn.powerAllocation = {
        ...cleanAllocation,
        total,
        confirmed: true
    };

    return {
        success: true,
        allocation: { ...gameState.turn.powerAllocation },
        budget,
        message: total === 0
            ? "Power plan saved. All extra power will stay in storage."
            : `Power plan saved. ${total} units will be used today.`
    };
}


// =====================================
// APPLY THE CONFIRMED PLAN AT END OF DAY
// =====================================

export function applyDailyPowerAllocation(gameState) {

    if (gameState.mission.powerPlanningEnabled !== true) {
        return {
            success: true,
            allocated: 0,
            scienceInsightsGained: 0,
            message: "Advanced power planning is off."
        };
    }

    const allocation = gameState.turn?.powerAllocation;

    if (!allocation?.confirmed) {
        return {
            success: false,
            message: "Save today's power plan before ending the Mars day."
        };
    }

    const total =
        (allocation.greenhouse ?? 0) +
        (allocation.rover ?? 0) +
        (allocation.shelter ?? 0);

    // Leave the four-unit life-support reserve untouched.
    if (
        !Number.isInteger(total) ||
        total < 0 ||
        gameState.resources.power - total <
            POWER_ALLOCATION_CONFIG.lifeSupportReserve
    ) {
        return {
            success: false,
            message: "There is not enough power for this plan and life support."
        };
    }

    gameState.resources.power -= total;

    // Extra greenhouse lighting and temperature control add a small bonus
    // to the next harvest. This is a simplified game effect.
    if (allocation.greenhouse === 2) {
        gameState.facilities.greenhouse.nextHarvestBonus =
            (gameState.facilities.greenhouse.nextHarvestBonus ?? 0) + 6;
    }

    const scienceInsightsGained = allocation.rover === 2 ? 1 : 0;

    gameState.systems.scienceInsightPoints =
        (gameState.systems.scienceInsightPoints ?? 0) +
        scienceInsightsGained;

    return {
        success: true,
        allocated: total,
        greenhouseBoost: allocation.greenhouse === 2,
        roverPowered: allocation.rover === 2,
        shelterPowered: allocation.shelter === 2,
        scienceInsightsGained,
        message: total === 0
            ? "No extra power was allocated."
            : `${total} power units were allocated to outpost systems.`
    };
}
