
/*
    ARES-6
    SIMULATION MANAGER

    Coordinates all simulation systems at the end of each Sol.

    Uses an atomic update:
    Either the complete Sol succeeds, or the original
    game state remains unchanged.
*/

import {
    canEndCurrentSol,
    endCurrentSol
} from "../game/turnManager.js";

import {
    generateSolarPower
} from "./powerSystem.js";

import {
    runLifeSupport,
    consumeCrewSupplies
} from "./lifeSupport.js";

import {
    advanceCropGrowth
} from "./greenhouse.js";

import {
    resolveRadiationEvent
} from "./radiationSystem.js";

import {
    processCommunication
} from "./communication.js";

import {
    applyDailyPowerAllocation
} from "../game/powerAllocation.js";


// =====================================
// 1. UPDATE CREW CONDITION
// =====================================

function updateCrewCondition(gameState) {

    const airFailures =
        gameState.systems.airFailureSols ?? 0;

    const supplyShortages =
        gameState.crew.supplyShortageSols ?? 0;

    const radiationRisk =
        gameState.crew.radiationRiskPoints ?? 0;


    // Check critical conditions.
    if (
        airFailures >= 2 ||
        supplyShortages >= 2 ||
        radiationRisk >= 5
    ) {

        gameState.crew.condition = "critical";

        return;

    }


    // Check warning conditions.
    if (
        gameState.systems.airStatus === "needs-attention" ||
        supplyShortages >= 1 ||
        radiationRisk >= 3
    ) {

        gameState.crew.condition = "needs-attention";

        return;

    }


    gameState.crew.condition = "healthy";

}


// =====================================
// 2. RUN A SINGLE SIMULATION STEP
// =====================================

function runSimulationStep(
    name,
    simulationFunction,
    gameState
) {

    try {

        const result = simulationFunction(gameState);


        if (!result || result.success !== true) {

            return {

                success: false,

                step: name,

                message:
                    result?.message ||
                    `${name} simulation failed.`

            };

        }


        return {

            success: true,

            step: name,

            result: result

        };


    } catch (error) {

        console.error(
            `Simulation error in ${name}:`,
            error
        );


        return {

            success: false,

            step: name,

            message:
                `${name} encountered an unexpected error.`

        };

    }

}


// =====================================
// 3. COMPLETE THE CURRENT SOL
// =====================================

export function completeCurrentSol(gameState) {

    // Validate original state.
    if (!gameState?.mission || !gameState?.turn) {

        return {

            success: false,

            message: "Game state is unavailable."

        };

    }


    // =====================================
    // 4. CREATE TEMPORARY GAME STATE
    // =====================================

    let draftState;

    try {

        draftState = structuredClone(gameState);

    } catch (error) {

        return {

            success: false,

            message: "Could not create a temporary simulation state."

        };

    }


    // Check whether ending the Sol is allowed.
    const validation = canEndCurrentSol(draftState);


    if (!validation.allowed) {

        return {

            success: false,

            message: validation.reason

        };

    }


    // Store simulation results.
    const results = {};


    // =====================================
    // STEP 1: GENERATE SOLAR ELECTRICITY
    // =====================================

    const powerResult = runSimulationStep(
        "Solar power",
        generateSolarPower,
        draftState
    );

    if (!powerResult.success) {
        return powerResult;
    }

    results.power = powerResult.result;


    // =====================================
    // STEP 1B: APPLY THE OPTIONAL POWER PLAN
    // =====================================

    const allocationResult = runSimulationStep(
        "Daily power allocation",
        applyDailyPowerAllocation,
        draftState
    );

    if (!allocationResult.success) {
        return allocationResult;
    }

    results.powerAllocation = allocationResult.result;


    // =====================================
    // STEP 2: OPERATE LIFE SUPPORT
    // =====================================

    const airResult = runSimulationStep(
        "Life support",
        runLifeSupport,
        draftState
    );

    if (!airResult.success) {
        return airResult;
    }

    results.lifeSupport = airResult.result;


    // =====================================
    // STEP 3: CONSUME CREW SUPPLIES
    // =====================================

    const supplyResult = runSimulationStep(
        "Crew supplies",
        consumeCrewSupplies,
        draftState
    );

    if (!supplyResult.success) {
        return supplyResult;
    }

    results.supplies = supplyResult.result;


    // =====================================
    // STEP 4: ADVANCE GREENHOUSE GROWTH
    // =====================================

    const cropResult = runSimulationStep(
        "Greenhouse",
        state => advanceCropGrowth(
            state,
            state.turn.powerAllocation?.greenhouse === 2
        ),
        draftState
    );

    if (!cropResult.success) {
        return cropResult;
    }

    results.greenhouse = cropResult.result;


    // =====================================
    // STEP 5: RESOLVE RADIATION EVENT
    // =====================================

    const radiationResult = runSimulationStep(
        "Radiation",
        resolveRadiationEvent,
        draftState
    );

    if (!radiationResult.success) {
        return radiationResult;
    }

    results.radiation = radiationResult.result;


    // =====================================
    // STEP 6: UPDATE CREW CONDITION
    // =====================================

    updateCrewCondition(draftState);


    // =====================================
    // STEP 7: END THE CURRENT SOL
    // =====================================

    const turnResult = endCurrentSol(draftState);


    if (!turnResult.ended) {

        return {

            success: false,

            message: turnResult.message,

            results: results

        };

    }


    results.turn = turnResult;


    // =====================================
    // STEP 8: PREPARE THE NEXT SOL
    // =====================================

    if (turnResult.advanced) {

        // Radiation warning applies to one Sol
        // in the current gameplay model.
        draftState.systems.radiationStatus = "safe";


        // Deliver any reply due on the new Sol.
        results.communication =
            processCommunication(draftState);

    }


    // =====================================
    // STEP 9: COMMIT COMPLETE SIMULATION
    // =====================================

    // No original state changes have occurred
    // until every simulation step succeeded.
    Object.assign(gameState, draftState);


    return {

        success: true,

        completed: true,

        results: results,

        currentSol: gameState.mission.currentSol,

        missionStatus: gameState.mission.status,

        message: turnResult.message

    };

}
