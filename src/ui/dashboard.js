
/*
    ARES-6
    DASHBOARD

    Updates resource values, Sol number and crew status.
*/


// =====================================
// 1. UPDATE RESOURCE VALUES
// =====================================

function updateText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


// =====================================
// 2. UPDATE STATUS INDICATORS
// =====================================

function updateStatus(id, value, labels) {

    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    const status = labels[value] ?? "Unknown";

    element.textContent = `● ${status}`;

    if (value === "good" || value === "healthy" || value === "safe") {

        element.className = "status-good";

    } else if (
        value === "needs-attention" ||
        value === "caution"
    ) {

        element.className = "status-warning";

    } else {

        element.className = "status-critical";

    }

}


// =====================================
// 3. UPDATE COMPLETE DASHBOARD
// =====================================

export function updateDashboard(gameState) {

    if (!gameState) {
        console.error("Cannot update dashboard: game state missing.");
        return;
    }


    // Update resources.
    updateText("power-value", gameState.resources.power);

    updateText("water-value", gameState.resources.water);

    updateText("food-value", gameState.resources.food);


    // Update Sol number.
    updateText(
        "sol-value",
        String(gameState.mission.currentSol).padStart(2, "0")
    );


    // Update crew and system status.
    updateStatus(
        "air-status-value",
        gameState.systems.airStatus,
        {
            good: "Good",
            "needs-attention": "Needs attention",
            critical: "Critical"
        }
    );


    updateStatus(
        "crew-status-value",
        gameState.crew.condition,
        {
            healthy: "Healthy",
            "needs-attention": "Needs attention",
            critical: "Critical"
        }
    );


    updateStatus(
        "radiation-status-value",
        gameState.systems.radiationStatus,
        {
            safe: "Safe",
            caution: "Caution",
            danger: "Danger"
        }
    );

}
