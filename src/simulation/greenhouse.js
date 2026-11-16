
/*
    ARES-6
    GREENHOUSE SYSTEM

    Manages crop production and food harvesting.
*/

import { GAME_CONFIG } from "../game/gameState.js";
import { consumePower } from "./powerSystem.js";


// =====================================
// 1. GREENHOUSE CONFIGURATION
// =====================================

const GREENHOUSE_CONFIG = {

    powerCost: 5,

    waterCost: 5,

    growthDuration: 2,

    foodHarvest: 12

};


// =====================================
// 2. START A CROP CYCLE
// =====================================

export function startCropCycle(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.resources ||
        !gameState?.facilities?.greenhouse
    ) {

        return {
            success: false,
            message: "Invalid game state."
        };

    }

    if (gameState.mission.status !== "playing") {

        return {
            success: false,
            message: "Mission is not active."
        };

    }


    const greenhouse = gameState.facilities.greenhouse;

    const { power, water } = gameState.resources;


    // Prevent starting another crop cycle.
    if (greenhouse.cropStatus === "growing") {

        return {
            success: false,
            message: "Crops are already growing."
        };

    }


    // Validate resources.
    if (
        !Number.isFinite(power) ||
        !Number.isFinite(water) ||
        power < 0 ||
        power > GAME_CONFIG.maxResource ||
        water < 0 ||
        water > GAME_CONFIG.maxResource
    ) {

        return {
            success: false,
            message: "Invalid resources."
        };

    }


    // Check whether resources are sufficient.
    if (power < GREENHOUSE_CONFIG.powerCost) {

        return {
            success: false,
            message: "Not enough power to start growing crops."
        };

    }

    if (water < GREENHOUSE_CONFIG.waterCost) {

        return {
            success: false,
            message: "Not enough water to start growing crops."
        };

    }


    // Consume electricity.
    const powerResult = consumePower(
        gameState,
        GREENHOUSE_CONFIG.powerCost,
        "Greenhouse"
    );

    if (!powerResult.success) {

        return powerResult;

    }


    // Consume water.
    gameState.resources.water -= GREENHOUSE_CONFIG.waterCost;


    // Start the crop cycle.
    greenhouse.cropStatus = "growing";

    greenhouse.solsUntilHarvest =
        GREENHOUSE_CONFIG.growthDuration;


    return {

        success: true,

        powerConsumed: GREENHOUSE_CONFIG.powerCost,

        waterConsumed: GREENHOUSE_CONFIG.waterCost,

        solsUntilHarvest: greenhouse.solsUntilHarvest,

        message: "Greenhouse crop cycle started."

    };

}


// =====================================
// 3. ADVANCE CROP GROWTH
// =====================================

export function advanceCropGrowth(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.resources ||
        !gameState?.facilities?.greenhouse
    ) {

        return {
            success: false,
            message: "Invalid game state."
        };

    }

    if (gameState.mission.status !== "playing") {

        return {
            success: false,
            message: "Mission is not active."
        };

    }


    const greenhouse = gameState.facilities.greenhouse;


    // Nothing to do if crops are not growing.
    if (greenhouse.cropStatus !== "growing") {

        return {

            success: true,

            advanced: false,

            message: "No crops are currently growing."

        };

    }


    // Check growth timer.
    if (
        !Number.isInteger(greenhouse.solsUntilHarvest) ||
        greenhouse.solsUntilHarvest <= 0
    ) {

        return {
            success: false,
            message: "Invalid crop growth timer."
        };

    }


    // Advance growth by one Sol.
    greenhouse.solsUntilHarvest--;


    // Crops are not ready yet.
    if (greenhouse.solsUntilHarvest > 0) {

        return {

            success: true,

            advanced: true,

            harvested: false,

            solsUntilHarvest: greenhouse.solsUntilHarvest,

            message: "Crops are still growing."

        };

    }


    // =====================================
    // 4. HARVEST CROPS
    // =====================================

    const currentFood = gameState.resources.food;

    if (
        !Number.isFinite(currentFood) ||
        currentFood < 0 ||
        currentFood > GAME_CONFIG.maxResource
    ) {

        // Restore the timer if the food reserve is invalid.
        greenhouse.solsUntilHarvest = 1;

        return {
            success: false,
            message: "Invalid food reserve."
        };

    }


    // Calculate harvest and storage capacity.
    const availableSpace =
        GAME_CONFIG.maxResource - currentFood;

    const bonusFood = Math.max(
        0,
        greenhouse.nextHarvestBonus ?? 0
    );

    const foodGained = Math.min(
        GREENHOUSE_CONFIG.foodHarvest + bonusFood,
        availableSpace
    );

    greenhouse.nextHarvestBonus = 0;


    // Update food reserves.
    gameState.resources.food += foodGained;


    // Finish the crop cycle.
    greenhouse.cropStatus = "empty";

    greenhouse.solsUntilHarvest = 0;

    greenhouse.totalHarvests++;


    return {

        success: true,

        advanced: true,

        harvested: true,

        foodGained: foodGained,

        totalHarvests: greenhouse.totalHarvests,

        currentFood: gameState.resources.food,

        message: "Crops harvested successfully!"

    };

}
