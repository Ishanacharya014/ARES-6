/*
    ARES-6
    WATER RECYCLING SYSTEM

    Simplified gameplay model: an operating recycler recovers
    a small amount of water after the crew's daily use.
    This is a game resource rule, not a Mars engineering prediction.
*/

import { GAME_CONFIG } from "../game/gameState.js";

const WATER_RECYCLER_CONFIG = {
    recoveryPerSol: 2
};

export function recoverWater(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.resources ||
        !gameState?.facilities?.waterRecycler
    ) {
        return {
            success: false,
            message: "Water recycler information is unavailable."
        };
    }

    if (gameState.mission.status !== "playing") {
        return {
            success: false,
            message: "Mission is not active."
        };
    }

    const currentWater = gameState.resources.water;

    if (
        !Number.isFinite(currentWater) ||
        currentWater < 0 ||
        currentWater > GAME_CONFIG.maxResource
    ) {
        return {
            success: false,
            message: "Invalid water reserve."
        };
    }

    if (!gameState.facilities.waterRecycler.operational) {
        return {
            success: true,
            operational: false,
            recovered: 0,
            currentWater,
            message: "The water recycler is offline."
        };
    }

    const recovered = Math.min(
        WATER_RECYCLER_CONFIG.recoveryPerSol,
        GAME_CONFIG.maxResource - currentWater
    );

    gameState.resources.water += recovered;

    return {
        success: true,
        operational: true,
        recovered,
        currentWater: gameState.resources.water,
        message: recovered > 0
            ? "The recycler recovered water for the next Mars day."
            : "The water tank is full. No extra water could be stored."
    };
}
