
/*
    ARES-6
    LIFE SUPPORT SYSTEM

    Manages breathable air and daily crew supplies.
*/

import { consumePower } from "./powerSystem.js";


// =====================================
// 1. LIFE SUPPORT CONFIGURATION
// =====================================

const LIFE_SUPPORT_CONFIG = {

    powerPerSol: 4,

    waterPerAstronaut: 1,

    foodPerAstronaut: 1,

    solsBeforeCritical: 2

};


// =====================================
// 2. OPERATE THE AIR SYSTEM
// =====================================

export function runLifeSupport(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.systems ||
        !gameState?.crew ||
        !gameState?.facilities?.habitat
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


    // Check whether the habitat is operational.
    const habitatAvailable =
        gameState.facilities.habitat.operational;


    // Try to operate the air system.
    const powerResult = habitatAvailable
        ? consumePower(
            gameState,
            LIFE_SUPPORT_CONFIG.powerPerSol,
            "Life support"
        )
        : {
            success: false,
            message: "Habitat is not operational."
        };


    // =====================================
    // 3. HANDLE AIR SYSTEM FAILURE
    // =====================================

    if (!powerResult.success) {

        gameState.systems.airFailureSols =
            (gameState.systems.airFailureSols ?? 0) + 1;


        if (
            gameState.systems.airFailureSols >=
            LIFE_SUPPORT_CONFIG.solsBeforeCritical
        ) {

            gameState.systems.airStatus = "critical";

            gameState.crew.condition = "critical";

        } else {

            gameState.systems.airStatus = "needs-attention";

        }


        return {

            success: true,

            powered: false,

            airStatus: gameState.systems.airStatus,

            failedSols: gameState.systems.airFailureSols,

            message: "Life support needs attention."

        };

    }


    // =====================================
    // 4. AIR SYSTEM WORKING
    // =====================================

    gameState.systems.airFailureSols = 0;

    gameState.systems.airStatus = "good";


    return {

        success: true,

        powered: true,

        consumed: LIFE_SUPPORT_CONFIG.powerPerSol,

        airStatus: "good",

        message: "Life support is operating normally."

    };

}


// =====================================
// 5. DAILY CREW FOOD AND WATER
// =====================================

export function consumeCrewSupplies(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.crew ||
        !gameState?.resources
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


    const crewCount = gameState.crew.count;


    if (
        !Number.isInteger(crewCount) ||
        crewCount < 1
    ) {

        return {
            success: false,
            message: "Invalid crew count."
        };

    }


    const water = gameState.resources.water;

    const food = gameState.resources.food;


    if (
        !Number.isFinite(water) ||
        !Number.isFinite(food) ||
        water < 0 ||
        food < 0
    ) {

        return {
            success: false,
            message: "Invalid crew supplies."
        };

    }


    // Calculate daily crew requirements.
    const waterRequired =
        crewCount * LIFE_SUPPORT_CONFIG.waterPerAstronaut;

    const foodRequired =
        crewCount * LIFE_SUPPORT_CONFIG.foodPerAstronaut;


    // Calculate how much is actually available.
    const waterConsumed = Math.min(water, waterRequired);

    const foodConsumed = Math.min(food, foodRequired);


    // Deduct the available supplies.
    gameState.resources.water -= waterConsumed;

    gameState.resources.food -= foodConsumed;


    // Check whether the crew received everything needed.
    const shortage =
        waterConsumed < waterRequired ||
        foodConsumed < foodRequired;


    if (shortage) {

        gameState.crew.supplyShortageSols =
            (gameState.crew.supplyShortageSols ?? 0) + 1;


        if (
            gameState.crew.supplyShortageSols >=
            LIFE_SUPPORT_CONFIG.solsBeforeCritical
        ) {

            gameState.crew.condition = "critical";

        } else {

            gameState.crew.condition = "needs-attention";

        }

    } else {

        gameState.crew.supplyShortageSols = 0;

        if (gameState.crew.condition === "needs-attention") {

            gameState.crew.condition = "healthy";

        }

    }


    return {

        success: true,

        waterConsumed: waterConsumed,

        foodConsumed: foodConsumed,

        waterShortage: waterRequired - waterConsumed,

        foodShortage: foodRequired - foodConsumed,

        crewCondition: gameState.crew.condition,

        message: shortage
            ? "The crew does not have enough supplies."
            : "The crew received its daily supplies."

    };

}
