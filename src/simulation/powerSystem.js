
/*
    ARES-6
    POWER SYSTEM

    Controls solar power generation and consumption.
*/

import { GAME_CONFIG } from "../game/gameState.js";


// =====================================
// 1. POWER CONFIGURATION
// =====================================

const POWER_CONFIG = {

    cleanGeneration: 10,

    dustyGeneration: 5

};


// =====================================
// 2. CHECK SOLAR POWER GENERATION
// =====================================

export function getSolarGeneration(gameState) {

    const dustLevel = gameState?.facilities?.solarArray?.dustLevel;

    if (dustLevel === "clean") {
        return POWER_CONFIG.cleanGeneration;
    }

    if (dustLevel === "dusty") {
        return POWER_CONFIG.dustyGeneration;
    }

    return 0;

}


// =====================================
// 3. GENERATE SOLAR POWER
// =====================================

export function generateSolarPower(gameState) {

    if (!gameState?.resources || !gameState?.mission) {

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

    const currentPower = gameState.resources.power;

    if (
        typeof currentPower !== "number" ||
        !Number.isFinite(currentPower) ||
        currentPower < 0 ||
        currentPower > GAME_CONFIG.maxResource
    ) {

        return {
            success: false,
            message: "Invalid power reserve."
        };

    }


    // Calculate electricity generation.
    const generated = getSolarGeneration(gameState);


    // Calculate how much storage space is available.
    const availableSpace =
        GAME_CONFIG.maxResource - currentPower;


    // Power cannot exceed maximum storage.
    const stored = Math.min(generated, availableSpace);


    // Update power reserve.
    gameState.resources.power += stored;


    return {

        success: true,

        generated: generated,

        stored: stored,

        wasted: generated - stored,

        currentPower: gameState.resources.power,

        message: "Solar power generation completed."

    };

}


// =====================================
// 4. CONSUME POWER
// =====================================

export function consumePower(gameState, amount, reason = "Equipment") {

    if (!gameState?.resources || !gameState?.mission) {

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


    // Validate consumption amount.
    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        return {
            success: false,
            message: "Invalid power consumption amount."
        };

    }


    const currentPower = gameState.resources.power;


    // Validate current power.
    if (
        typeof currentPower !== "number" ||
        !Number.isFinite(currentPower) ||
        currentPower < 0 ||
        currentPower > GAME_CONFIG.maxResource
    ) {

        return {
            success: false,
            message: "Invalid power reserve."
        };

    }


    // Check available electricity.
    if (currentPower < amount) {

        return {
            success: false,
            message: "Not enough power to operate."
        };

    }


    // Deduct electricity.
    gameState.resources.power -= amount;


    return {

        success: true,

        consumed: amount,

        remainingPower: gameState.resources.power,

        reason: reason,

        message: `${reason} used ${amount} power units.`

    };

}


// =====================================
// 5. CHANGE SOLAR PANEL CONDITION
// =====================================

export function setSolarDustLevel(gameState, level) {

    if (!gameState?.facilities?.solarArray) {

        return {
            success: false,
            message: "Solar station not found."
        };

    }

    if (gameState.mission?.status !== "playing") {

        return {
            success: false,
            message: "Mission is not active."
        };

    }

    const validLevels = ["clean", "dusty"];

    if (!validLevels.includes(level)) {

        return {
            success: false,
            message: "Invalid solar panel condition."
        };

    }


    gameState.facilities.solarArray.dustLevel = level;


    return {

        success: true,

        dustLevel: level,

        message: `Solar panels are now ${level}.`

    };

}
