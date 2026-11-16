
/*
    ARES-6
    OBJECTIVE MANAGER

    Tracks the player's scientific research.
*/


// =====================================
// 1. AVAILABLE OBJECTIVES
// =====================================

export const OBJECTIVES = {

    geologicalResearch: {
        title: "Geological Research",
        description: "Collect and study a Martian rock sample."
    },

    environmentalResearch: {
        title: "Environmental Research",
        description: "Study the Martian environment."
    },

    waterIceResearch: {
        title: "Water-Ice Survey",
        description: "Use the rover to investigate signs of water ice."
    },

    atmosphericResearch: {
        title: "Atmosphere Study",
        description: "Study the air and dust around the outpost."
    }

};


// =====================================
// 2. COMPLETE AN OBJECTIVE
// =====================================

export function completeObjective(gameState, objectiveId) {

    // Validate game state.
    if (
        !gameState ||
        !gameState.mission ||
        !gameState.objectives
    ) {

        return {
            success: false,
            message: "Invalid game state."
        };

    }


    // Mission must be active.
    if (gameState.mission.status !== "playing") {

        return {
            success: false,
            message: "The mission is not active."
        };

    }


    // Check whether the objective exists.
    if (
        !Object.hasOwn(OBJECTIVES, objectiveId) ||
        typeof gameState.objectives[objectiveId] !== "boolean"
    ) {

        return {
            success: false,
            message: "Unknown research objective."
        };

    }


    // Prevent completing an objective twice.
    if (gameState.objectives[objectiveId]) {

        return {
            success: false,
            message: "This objective is already complete."
        };

    }


    // Mark the objective as completed.
    gameState.objectives[objectiveId] = true;


    // Record completion in mission history.
    gameState.history.push({

        sol: gameState.mission.currentSol,

        type: "objective-completed",

        objectiveId: objectiveId,

        title: OBJECTIVES[objectiveId].title

    });


    return {

        success: true,

        message: "Research objective completed.",

        objective: OBJECTIVES[objectiveId].title

    };

}


// =====================================
// 3. GET RESEARCH PROGRESS
// =====================================

export function getObjectiveProgress(gameState) {

    const completedObjectives =
        Object.values(gameState.objectives)
            .filter(completed => completed).length;

    const totalObjectives =
        Object.keys(OBJECTIVES).length;


    return {

        completed: completedObjectives,

        total: totalObjectives,

        remaining: totalObjectives - completedObjectives,

        percentage:
            Math.round(
                completedObjectives / totalObjectives * 100
            )

    };

}


// =====================================
// 4. CHECK WHETHER ALL OBJECTIVES ARE DONE
// =====================================

export function areAllObjectivesComplete(gameState) {

    const progress = getObjectiveProgress(gameState);

    return progress.completed === progress.total;

}
