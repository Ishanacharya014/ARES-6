
/*
    ARES-6
    RADIATION SYSTEM

    Manages radiation warnings and shelter protection.

    Risk points are fictional gameplay values.
    They are NOT radiation dose measurements.
*/

import { GAME_CONFIG } from "../game/gameState.js";


// =====================================
// 1. RADIATION CONFIGURATION
// =====================================

const RADIATION_CONFIG = {

    waterForShielding: 5,

    riskPoints: {
        safe: 0,
        caution: 1,
        danger: 2
    },

    shieldingProtection: 1,

    attentionThreshold: 3,

    criticalThreshold: 5

};


// =====================================
// 2. SET RADIATION WARNING
// =====================================

export function setRadiationStatus(gameState, status) {

    if (!gameState?.systems || !gameState?.mission) {

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


    const validStatuses = ["safe", "caution", "danger"];

    if (!validStatuses.includes(status)) {

        return {
            success: false,
            message: "Invalid radiation status."
        };

    }


    gameState.systems.radiationStatus = status;


    return {

        success: true,

        radiationStatus: status,

        message: `Radiation warning updated to ${status}.`

    };

}


// =====================================
// 3. ALLOCATE WATER TO SHELTER
// =====================================

export function allocateWaterForShielding(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.resources ||
        !gameState?.facilities?.shelter
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


    const shelter = gameState.facilities.shelter;

    const currentWater = gameState.resources.water;


    // Prevent duplicate water allocation.
    if (shelter.shieldingLevel === "basic") {

        return {
            success: false,
            message: "Shelter already has basic shielding."
        };

    }


    // Validate water reserve.
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


    // Check whether enough water is available.
    if (currentWater < RADIATION_CONFIG.waterForShielding) {

        return {
            success: false,
            message: "Not enough water for shielding."
        };

    }


    // Move water from normal storage to shelter allocation.
    const allocated =
        RADIATION_CONFIG.waterForShielding;


    gameState.resources.water -= allocated;

    shelter.waterAllocated += allocated;

    shelter.shieldingLevel = "basic";


    return {

        success: true,

        waterAllocated: allocated,

        remainingWater: gameState.resources.water,

        shieldingLevel: shelter.shieldingLevel,

        message: "Basic shelter shielding is ready."

    };

}


// =====================================
// 4. RELEASE SHELTER WATER
// =====================================

export function releaseWaterFromShielding(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.resources ||
        !gameState?.facilities?.shelter
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


    const shelter = gameState.facilities.shelter;

    const allocated = shelter.waterAllocated;

    if (
        !Number.isFinite(allocated) ||
        allocated < 0
    ) {

        return {
            success: false,
            message: "Invalid shelter water allocation."
        };

    }


    if (
        allocated === 0 ||
        shelter.shieldingLevel === "none"
    ) {

        return {
            success: false,
            message: "No allocated shelter water to release."
        };

    }


    // Check available water storage.
    const availableSpace =
        GAME_CONFIG.maxResource - gameState.resources.water;


    // Return only the amount that can be stored.
    const returned = Math.min(allocated, availableSpace);


    gameState.resources.water += returned;

    shelter.waterAllocated -= returned;


    // Remove shielding only if all allocated water is released.
    if (shelter.waterAllocated === 0) {

        shelter.shieldingLevel = "none";

    }


    return {

        success: true,

        returned: returned,

        remainingAllocated: shelter.waterAllocated,

        currentWater: gameState.resources.water,

        message: "Shelter water allocation updated."

    };

}


// =====================================
// 5. RESOLVE A RADIATION EVENT
// =====================================

export function resolveRadiationEvent(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.systems ||
        !gameState?.crew ||
        !gameState?.facilities?.shelter
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


    const radiationStatus =
        gameState.systems.radiationStatus;


    // Get the event's base risk.
    const baseRisk =
        RADIATION_CONFIG.riskPoints[radiationStatus];


    if (baseRisk === undefined) {

        return {
            success: false,
            message: "Invalid radiation warning."
        };

    }


    // Water shielding and the advanced powered shield can both help.
    const hasShielding =
        gameState.facilities.shelter.shieldingLevel === "basic";

    const hasPoweredShielding =
        gameState.turn?.powerAllocation?.shelter === 2;

    const protection =
        (hasShielding ? RADIATION_CONFIG.shieldingProtection : 0) +
        (hasPoweredShielding ? RADIATION_CONFIG.shieldingProtection : 0);


    const riskAdded = Math.max(
        0,
        baseRisk - protection
    );


    // Validate the existing score.
    const currentRisk = gameState.crew.radiationRiskPoints;

    if (
        !Number.isInteger(currentRisk) ||
        currentRisk < 0
    ) {

        return {
            success: false,
            message: "Invalid radiation risk score."
        };

    }


    // Add simulated risk points.
    gameState.crew.radiationRiskPoints += riskAdded;


    const totalRisk =
        gameState.crew.radiationRiskPoints;


    // Update crew condition.
    if (
        totalRisk >= RADIATION_CONFIG.criticalThreshold
    ) {

        gameState.crew.condition = "critical";

    } else if (
        totalRisk >= RADIATION_CONFIG.attentionThreshold &&
        gameState.crew.condition !== "critical"
    ) {

        gameState.crew.condition = "needs-attention";

    }


    return {

        success: true,

        radiationStatus: radiationStatus,

        shieldingActive: hasShielding || hasPoweredShielding,

        waterShieldingActive: hasShielding,

        poweredShieldingActive: hasPoweredShielding,

        riskAdded: riskAdded,

        totalRisk: totalRisk,

        crewCondition: gameState.crew.condition,

        message: "Radiation event resolved."

    };

}
