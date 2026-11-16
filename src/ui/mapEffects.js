/*
    ARES-6
    MAP ENVIRONMENT EFFECTS

    Turns current mission conditions into lightweight map visuals.
    All effects are presentation-only; they never change simulation values.
*/

function ensureMapEffectLayers(map) {

    let effects = map.querySelector(".map-weather-effects");

    if (!effects) {
        effects = document.createElement("div");
        effects.className = "map-weather-effects";
        effects.setAttribute("aria-hidden", "true");
        effects.innerHTML = `
            <div class="map-dust-layer">
                <i></i><i></i><i></i><i></i><i></i><i></i>
                <i></i><i></i><i></i><i></i><i></i><i></i>
                <i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
            <div class="map-radiation-layer"></div>
            <div class="map-air-alert-layer"></div>
            <div class="map-crop-particle-layer">
                <i>✦</i><i>✧</i><i>✦</i><i>✧</i>
            </div>
            <div class="map-shield-layer"></div>
        `;

        map.append(effects);
    }

    let status = map.querySelector(".map-condition-status");

    if (!status) {
        status = document.createElement("div");
        status.className = "map-condition-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        map.append(status);
    }

    return { effects, status };
}


// =====================================
// UPDATE VISUALS FROM CURRENT GAME STATE
// =====================================

export function refreshMapEffects(gameState) {

    const map = document.querySelector("#outpost-map");

    if (!map || !gameState?.facilities || !gameState?.systems) {
        return false;
    }

    const { status } = ensureMapEffectLayers(map);

    const dusty =
        gameState.facilities.solarArray?.dustLevel === "dusty";

    const radiation =
        gameState.systems.radiationStatus === "danger"
            ? "danger"
            : gameState.systems.radiationStatus === "caution"
                ? "caution"
                : "safe";

    const airProblem =
        gameState.facilities.habitat?.operational === false ||
        gameState.systems.airStatus === "needs-attention" ||
        gameState.systems.airStatus === "critical";

    const cropsGrowing =
        gameState.facilities.greenhouse?.cropStatus === "growing";

    const shelterProtected =
        gameState.facilities.shelter?.shieldingLevel === "basic";

    const messagePending =
        Boolean(gameState.communication?.pendingReply);

    // CSS reads these values to activate the matching effects.
    map.dataset.weather = dusty ? "dusty" : "clear";
    map.dataset.radiation = radiation;
    map.dataset.air = airProblem ? "warning" : "good";
    map.dataset.crops = cropsGrowing ? "growing" : "idle";
    map.dataset.shielding = shelterProtected ? "active" : "inactive";
    map.dataset.comms = messagePending ? "pending" : "idle";

    const conditions = [];

    if (dusty) {
        conditions.push({
            type: "dust",
            label: "DUST ON SOLAR PANELS"
        });
    }

    if (radiation === "danger") {
        conditions.push({
            type: "radiation",
            label: "SPACE RADIATION WARNING"
        });
    } else if (radiation === "caution") {
        conditions.push({
            type: "caution",
            label: "SPACE WEATHER CAUTION"
        });
    }

    if (airProblem) {
        conditions.push({
            type: "air",
            label: "AIR SYSTEM NEEDS ATTENTION"
        });
    }

    if (cropsGrowing) {
        const days = gameState.facilities.greenhouse.solsUntilHarvest;
        conditions.push({
            type: "crops",
            label: days > 0
                ? "FOOD GROWING · " + days + " MARS DAY(S) LEFT"
                : "FOOD READY SOON"
        });
    }

    if (shelterProtected) {
        conditions.push({
            type: "shield",
            label: "SHELTER EXTRA PROTECTION READY"
        });
    }

    if (messagePending) {
        conditions.push({
            type: "comms",
            label: "MESSAGE FROM EARTH IN TRANSIT"
        });
    }

    status.replaceChildren();

    if (conditions.length > 0) {
        const heading = document.createElement("span");
        heading.className = "map-condition-heading";
        heading.textContent = "OUTPOST CONDITIONS";
        status.append(heading);

        conditions.forEach(condition => {
            const badge = document.createElement("span");
            badge.className = "map-condition-badge map-condition-" + condition.type;
            badge.textContent = condition.label;
            status.append(badge);
        });

        status.hidden = false;
    } else {
        status.hidden = true;
    }

    return true;
}
