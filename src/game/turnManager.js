
/*
    ARES-6
    TURN MANAGER

    Controls the 14-day mission progression.
*/


// =====================================
// 1. CHECK IF THE PLAYER CAN END THE SOL
// =====================================

export function canEndCurrentSol(gameState) {

    // Check whether the game exists.
    if (!gameState || !gameState.mission || !gameState.turn) {

        return {
            allowed: false,
            reason: "Game state is unavailable."
        };

    }

    // Mission must still be active.
    if (gameState.mission.status !== "playing") {

        return {
            allowed: false,
            reason: "The mission has already ended."
        };

    }

    // Player must make one major decision.
    if (!gameState.turn.decisionMade) {

        return {
            allowed: false,
            reason: "Make today's decision first."
        };

    }

    // Advanced players must also save their daily power plan.
    if (
        gameState.mission.powerPlanningEnabled === true &&
        gameState.turn.powerAllocation?.confirmed !== true
    ) {

        return {
            allowed: false,
            reason: "Save today's power plan before ending the Mars day."
        };

    }

    return {
        allowed: true,
        reason: "Ready to end the Sol."
    };

}


// =====================================
// 2. CHECK IF THE MISSION HAS FAILED
// =====================================

function checkMissionFailure(gameState) {

    const crewFailed =
        gameState.crew.condition === "critical";

    const airFailed =
        gameState.systems.airStatus === "critical";

    return crewFailed || airFailed;

}


// =====================================
// 3. CHECK THE FINAL MISSION RESULT
// =====================================

function getMissionResult(gameState) {

    const allObjectivesComplete =
        Object.values(gameState.objectives).every(Boolean);

    const reportTransmitted =
        gameState.mission.finalReportTransmitted === true;

    if (allObjectivesComplete && reportTransmitted) {

        return "success";

    }

    return "partial-success";

}


// =====================================
// 4. END THE CURRENT SOL
// =====================================

export function endCurrentSol(gameState) {

    // First, check whether ending is allowed.
    const check = canEndCurrentSol(gameState);

    if (!check.allowed) {

        return {
            ended: false,
            message: check.reason
        };

    }


    // Check whether the crew has reached
    // a critical failure condition.
    if (checkMissionFailure(gameState)) {

        gameState.mission.status = "failure";

        return {
            ended: true,
            advanced: false,
            outcome: "failure",
            message: "The mission has failed."
        };

    }


    // Check whether this is the final Sol.
    if (
        gameState.mission.currentSol >=
        gameState.mission.totalSols
    ) {

        gameState.mission.status =
            getMissionResult(gameState);

        return {
            ended: true,
            advanced: false,
            outcome: gameState.mission.status,
            message: "The 14-day Mars mission is complete."
        };

    }


    // Advance to the next Sol.
    gameState.mission.currentSol++;


    // Reset daily decision information.
    gameState.turn.decisionMade = false;

    gameState.turn.selectedChoiceId = null;

    gameState.turn.currentEventId = null;

    // Each Mars day starts with a fresh optional power plan.
    gameState.turn.powerAllocation = {
        greenhouse: 0,
        rover: 0,
        shelter: 0,
        total: 0,
        confirmed: false
    };


    return {
        ended: true,
        advanced: true,
        currentSol: gameState.mission.currentSol,
        message: "A new Sol has started."
    };

}
