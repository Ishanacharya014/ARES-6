
/*
    ARES-6
    GAME STATE

    Stores all information about the current mission.
*/

// =====================================
// 1. GAME CONFIGURATION
// =====================================

export const GAME_CONFIG = {

    totalSols: 14,

    crewCount: 4,

    maxResource: 100,

    decisionsPerSol: 1,

    startingResources: {
        power: 80,
        water: 70,
        food: 60
    }

};


// =====================================
// 2. CREATE A NEW GAME
// =====================================

export function createInitialGameState(scenarioId = "standard", options = {}) {

    const validScenarioIds = [
        "standard",
        "may-2024-solar-storm"
    ];

    const selectedScenarioId = validScenarioIds.includes(scenarioId)
        ? scenarioId
        : "standard";

    return {

        // Mission information
        mission: {
            currentSol: 1,
            totalSols: GAME_CONFIG.totalSols,
            status: "playing",
            scenarioId: selectedScenarioId,
            powerPlanningEnabled: options.powerPlanningEnabled === true,
            finalReportTransmitted: false
        },


        // Astronaut information
        crew: {
            count: GAME_CONFIG.crewCount,
            condition: "healthy",
            supplyShortageSols: 0,
            radiationRiskPoints: 0
        },


        // Main resources
        resources: {
            ...GAME_CONFIG.startingResources
        },


        // Environmental and life-support systems
        systems: {
            airStatus: "good",
            radiationStatus: "safe",
            airFailureSols: 0,
            scienceInsightPoints: 0
        },


        // Facility conditions
        facilities: {

            habitat: {
                operational: true
            },

            solarArray: {
                dustLevel: "clean"
            },

            greenhouse: {
                cropStatus: "empty",
                solsUntilHarvest: 0,
                totalHarvests: 0,
                nextHarvestBonus: 0
            },

            shelter: {
                shieldingLevel: "none",
                waterAllocated: 0
            },

            waterRecycler: {
                operational: true
            }

        },


        // Supporting equipment
        supportAssets: {

            antennaOperational: true,

            roverAvailable: true

        },


        // Current Sol information
        turn: {

            decisionMade: false,

            selectedChoiceId: null,

            currentEventId: null,

            powerAllocation: {
                greenhouse: 0,
                rover: 0,
                shelter: 0,
                confirmed: false
            }

        },


        // Scientific research objectives
        objectives: {

            geologicalResearch: false,

            environmentalResearch: false,

            waterIceResearch: false,

            atmosphericResearch: false

        },


        // Communication with Earth
        communication: {

            pendingReply: null,

            receivedMessages: []

        },


        // History of player decisions
        history: []

    };

}
