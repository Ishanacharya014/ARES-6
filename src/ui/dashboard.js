
/*
    ARES-6
    DASHBOARD

    Synchronizes the interface with the current game state.
*/


// =====================================
// 1. UPDATE TEXT ELEMENTS
// =====================================

function updateText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = String(value);
    }

}


// =====================================
// 2. UPDATE STATUS INDICATORS
// =====================================

function updateStatus(id, value, labels) {

    const element = document.getElementById(id);

    if (!element) return;

    const status = labels[value] ?? "Unknown";

    element.textContent = status;

    element.classList.remove(
        "status-good",
        "status-warning",
        "status-critical"
    );

    if (
        value === "good" ||
        value === "healthy" ||
        value === "safe"
    ) {

        element.classList.add("status-good");

    } else if (
        value === "needs-attention" ||
        value === "caution"
    ) {

        element.classList.add("status-warning");

    } else if (
        value === "critical" ||
        value === "danger"
    ) {

        element.classList.add("status-critical");

    } else {

        element.classList.add("status-warning");

    }

}


// =====================================
// 3. UPDATE MISSION STATUS
// =====================================

function updateMissionStatus(gameState) {

    const missionStatus = gameState.mission.status;

    const labels = {

        playing: "MARS MISSION ACTIVE",
        success: "MISSION COMPLETE",
        "partial-success": "MISSION COMPLETE",
        failure: "MISSION FAILED"

    };

    updateText(
        "mission-status-label",
        labels[missionStatus] ?? "MISSION STATUS UNKNOWN"
    );

    const dot = document.getElementById("mission-status-dot");

    if (dot) {
        dot.dataset.status = missionStatus;
    }

}


// =====================================
// 4. UPDATE MISSION OBJECTIVES
// =====================================

function updateObjectives(gameState) {

    const objectives = gameState.objectives;

    const objectiveStatus = {
        geologicalResearch: "geological-objective-status",
        environmentalResearch: "environmental-objective-status",
        waterIceResearch: "water-ice-objective-status",
        atmosphericResearch: "atmospheric-objective-status"
    };

    for (const [key, elementId] of Object.entries(objectiveStatus)) {
        updateText(
            elementId,
            objectives[key] ? "Done" : "Not started"
        );
    }

    const completedObjectives =
        Object.values(objectives).filter(Boolean).length;

    const totalObjectives = Object.keys(objectives).length;

    updateText(
        "completed-objectives-value",
        `${completedObjectives} / ${totalObjectives}`
    );

    const objectiveFill = document.getElementById(
        "objectives-progress-fill"
    );

    if (objectiveFill) {
        objectiveFill.style.width =
            `${totalObjectives > 0 ? completedObjectives / totalObjectives * 100 : 0}%`;
    }

}


// =====================================
// 5. UPDATE SEVEN-SOL TIMELINE
// =====================================

function updateSolTimeline(gameState) {

    const currentSol = gameState.mission.currentSol;

    const totalSols = gameState.mission.totalSols;

    updateText(
        "sol-progress-label",
        `Mars day ${currentSol} of ${totalSols}`
    );


    const timeline = document.getElementById(
        "sol-timeline"
    );

    if (!timeline) return;


    timeline.querySelectorAll("[data-sol-step]")
        .forEach(step => {

            const number = Number(step.dataset.solStep);

            step.classList.toggle(
                "is-complete",
                number < currentSol ||
                (
                    number === currentSol &&
                    gameState.mission.status !== "playing"
                )
            );

            step.classList.toggle(
                "is-current",
                number === currentSol &&
                gameState.mission.status === "playing"
            );

        });

}


// =====================================
// 6. UPDATE COMPLETE DASHBOARD
// =====================================

export function updateDashboard(gameState) {

    // Validate game state.
    if (
        !gameState?.resources ||
        !gameState?.mission ||
        !gameState?.crew ||
        !gameState?.systems ||
        !gameState?.objectives
    ) {

        console.error(
            "Cannot update dashboard: invalid game state."
        );

        return false;

    }


    // =====================================
    // RESOURCES
    // =====================================

    updateText("power-value", gameState.resources.power);

    updateText("water-value", gameState.resources.water);

    updateText("food-value", gameState.resources.food);


    // =====================================
    // MISSION PROGRESS
    // =====================================

    updateText(
        "sol-value",
        String(gameState.mission.currentSol).padStart(2, "0")
    );

    updateText(
        "total-sols-value",
        String(gameState.mission.totalSols).padStart(2, "0")
    );


    // =====================================
    // CREW COUNT
    // =====================================

    updateText(
        "crew-count-value",
        gameState.crew.count
    );


    // =====================================
    // AIR SYSTEM
    // =====================================

    updateStatus(
        "air-status-value",
        gameState.systems.airStatus,
        {
            good: "Good",
            "needs-attention": "Needs attention",
            critical: "Critical"
        }
    );


    // =====================================
    // CREW CONDITION
    // =====================================

    updateStatus(
        "crew-status-value",
        gameState.crew.condition,
        {
            healthy: "Healthy",
            "needs-attention": "Needs attention",
            critical: "Critical"
        }
    );


    // =====================================
    // RADIATION STATUS
    // =====================================

    updateStatus(
        "radiation-status-value",
        gameState.systems.radiationStatus,
        {
            safe: "Safe",
            caution: "Caution",
            danger: "Danger"
        }
    );

    updateStatus(
        "water-recycler-status-value",
        gameState.facilities?.waterRecycler?.operational ? "good" : "critical",
        {
            good: "Working",
            critical: "Offline"
        }
    );


    // =====================================
    // OVERALL MISSION STATUS
    // =====================================

    updateMissionStatus(gameState);


    // =====================================
    // OBJECTIVES
    // =====================================

    updateObjectives(gameState);


    // =====================================
    // SOL TIMELINE
    // =====================================

    updateSolTimeline(gameState);


    return true;

}
