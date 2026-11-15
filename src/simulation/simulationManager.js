
/*
    ARES-6
    SIMULATION MANAGER

    Coordinates all simulation systems
    at the end of each Sol.
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


    // All systems are healthy.
    gameState.crew.condition = "healthy";

}


// =====================================
// 2. RUN A SINGLE SIMULATION STEP
// =====================================

function runSimulationStep(name, simulationFunction, gameState) {

    const result = simulationFunction(gameState);

    if (!result.success) {

        return {
            success: false,
            step: name,
            message: result.message
        };

    }

    return {
        success: true,
        step: name,
        result: result
    };

}


// =====================================
// 3. COMPLETE THE CURRENT SOL
// =====================================

export function completeCurrentSol(gameState) {

    // Check whether ending the Sol is allowed.
    const validation = canEndCurrentSol(gameState);

    if (!validation.allowed) {

        return {
            success: false,
            message: validation.reason
        };

    }


    // Store simulation results.
    const results = {};


    // STEP 1: Generate solar electricity.
    const powerResult = runSimulationStep(
        "Solar power",
        generateSolarPower,
        gameState
    );

    if (!powerResult.success) {
        return powerResult;
    }

    results.power = powerResult.result;


    // STEP 2: Operate life support.
    const airResult = runSimulationStep(
        "Life support",
        runLifeSupport,
        gameState
    );

    if (!airResult.success) {
        return airResult;
    }

    results.lifeSupport = airResult.result;


    // STEP 3: Consume crew food and water.
    const supplyResult = runSimulationStep(
        "Crew supplies",
        consumeCrewSupplies,
        gameState
    );

    if (!supplyResult.success) {
        return supplyResult;
    }

    results.supplies = supplyResult.result;


    // STEP 4: Advance greenhouse growth.
    const cropResult = runSimulationStep(
        "Greenhouse",
        advanceCropGrowth,
        gameState
    );

    if (!cropResult.success) {
        return cropResult;
    }

    results.greenhouse = cropResult.result;


    // STEP 5: Resolve the radiation warning.
    const radiationResult = runSimulationStep(
        "Radiation",
        resolveRadiationEvent,
        gameState
    );

    if (!radiationResult.success) {
        return radiationResult;
    }

    results.radiation = radiationResult.result;


    // STEP 6: Recalculate overall crew condition.
    updateCrewCondition(gameState);


    // STEP 7: End the Sol and evaluate the mission.
    const turnResult = endCurrentSol(gameState);

    if (!turnResult.ended) {

        return {
            success: false,
            message: turnResult.message,
            results: results
        };

    }


    results.turn = turnResult;


    // STEP 8: Prepare the next Sol.
    if (turnResult.advanced) {

        // Radiation warnings apply to one Sol
        // in our current gameplay model.
        gameState.systems.radiationStatus = "safe";


        // Deliver any reply due on the new Sol.
        results.communication = processCommunication(gameState);

    }


    return {

        success: true,

        completed: true,

        results: results,

        currentSol: gameState.mission.currentSol,

        missionStatus: gameState.mission.status,

        message: turnResult.message

    };

}
