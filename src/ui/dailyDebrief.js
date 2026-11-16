/*
    ARES-6
    DAILY MISSION DEBRIEF

    Summarizes the player's decision and the actual simulation results
    after each Mars day. All values are read from the game state/results.
*/

const RESOURCE_ORDER = [
    {
        key: "power",
        label: "Power",
        icon: "⚡"
    },
    {
        key: "water",
        label: "Water",
        icon: "💧"
    },
    {
        key: "food",
        label: "Food",
        icon: "🌱"
    }
];

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}

function signed(value) {
    if (value > 0) return "+" + value;
    return String(value);
}

function getDayStartResources(beforeState, decision) {

    const decisionChanges = decision?.resourceChanges ?? {};

    const start = {};

    for (const resource of RESOURCE_ORDER) {

        const value = Number(beforeState?.resources?.[resource.key] ?? 0);
        const decisionChange = Number(decisionChanges[resource.key] ?? 0);

        start[resource.key] = Math.max(0, value - decisionChange);
    }

    return start;
}

function renderResourceSummary(startResources, endResources) {

    return RESOURCE_ORDER.map(resource => {

        const start = Number(startResources[resource.key] ?? 0);
        const end = Number(endResources?.[resource.key] ?? 0);
        const difference = end - start;
        const changeClass = difference > 0
            ? "is-positive"
            : difference < 0
                ? "is-negative"
                : "is-neutral";

        const changeLabel = difference === 0
            ? "No change"
            : signed(difference) + " units";

        return `
            <article class="debrief-resource-card">
                <div class="debrief-resource-top">
                    <span>${resource.icon} ${resource.label}</span>
                    <strong class="${changeClass}">${escapeHTML(changeLabel)}</strong>
                </div>
                <div class="debrief-resource-values">
                    <span>
                        <small>Start</small>
                        <strong>${start}</strong>
                    </span>
                    <span class="debrief-resource-arrow" aria-hidden="true">→</span>
                    <span>
                        <small>End</small>
                        <strong>${end}</strong>
                    </span>
                </div>
            </article>
        `;
    }).join("");
}

function addOperation(items, title, description, status = "info") {
    items.push({ title, description, status });
}

function getOperationSummary(results, afterState) {

    const items = [];

    const power = results?.power;
    if (power) {
        addOperation(
            items,
            "Solar panels",
            `Generated ${power.generated ?? 0} power units and stored ${power.stored ?? 0}.`
        );
    }

    const allocation = results?.powerAllocation;
    if (allocation?.allocated > 0) {

        const targets = allocation.allocation ?? {};

        const destinations = [
            targets.greenhouse === 2 ? "greenhouse" : null,
            targets.rover === 2 ? "science rover" : null,
            targets.shelter === 2 ? "radiation shelter" : null
        ].filter(Boolean);

        addOperation(
            items,
            "Extra power plan",
            `${allocation.allocated} power units sent to ${destinations.join(", ") || "outpost systems"}.`
        );

    } else if (allocation) {
        addOperation(
            items,
            "Extra power plan",
            "No extra power was used. Power stayed in storage."
        );
    }

    const lifeSupport = results?.lifeSupport;
    if (lifeSupport) {

        if (lifeSupport.powered) {
            addOperation(
                items,
                "Life support",
                `The air system worked normally and used ${lifeSupport.consumed ?? 0} power units.`,
                "good"
            );
        } else {
            addOperation(
                items,
                "Life support",
                `The air system could not run. This is Mars day ${lifeSupport.failedSols} with an air-system problem.`,
                "warning"
            );
        }

    }

    const supplies = results?.supplies;
    if (supplies) {

        addOperation(
            items,
            "Crew supplies",
            `The crew used ${supplies.waterConsumed ?? 0} water units and ${supplies.foodConsumed ?? 0} food units.`,
            supplies.waterShortage > 0 || supplies.foodShortage > 0
                ? "warning"
                : "good"
        );

        if (supplies.waterShortage > 0 || supplies.foodShortage > 0) {
            addOperation(
                items,
                "Supply warning",
                `Shortage: ${supplies.waterShortage ?? 0} water units and ${supplies.foodShortage ?? 0} food units.`,
                "warning"
            );
        }

    }

    const greenhouse = results?.greenhouse;
    if (greenhouse?.harvested) {

        addOperation(
            items,
            "Greenhouse harvest",
            `Crops were ready. The harvest added ${greenhouse.foodGained ?? 0} food units.`,
            "good"
        );

    } else if (greenhouse?.advanced) {

        addOperation(
            items,
            "Greenhouse growth",
            greenhouse.solsUntilHarvest > 0
                ? `Crops grew. ${greenhouse.solsUntilHarvest} Mars day(s) remain before harvest.`
                : "The crop cycle advanced.",
            "good"
        );

    }

    const radiation = results?.radiation;
    if (radiation && radiation.radiationStatus !== "safe") {

        const shieldText = radiation.poweredShieldingActive
            ? "The powered shelter plan reduced the game's risk points."
            : radiation.waterShieldingActive
                ? "The shelter's water-based protection reduced the game's risk points."
                : "No extra shelter protection was active.";

        addOperation(
            items,
            "Radiation warning",
            `The warning added ${radiation.riskAdded ?? 0} fictional game risk point(s). ${shieldText}`,
            radiation.riskAdded > 0 ? "warning" : "good"
        );

    }

    const communication = results?.communication;
    if (communication?.delivered || communication?.message) {

        addOperation(
            items,
            "Communication",
            communication.message || "A message from Earth was delivered."
        );

    }

    if (items.length === 0) {
        addOperation(
            items,
            "Outpost systems",
            "The daily systems completed their checks."
        );
    }

    return items;
}

function renderOperations(items) {

    return items.map(item => `
        <article class="debrief-operation" data-status="${escapeHTML(item.status)}">
            <span class="debrief-operation-indicator" aria-hidden="true"></span>
            <div>
                <strong>${escapeHTML(item.title)}</strong>
                <p>${escapeHTML(item.description)}</p>
            </div>
        </article>
    `).join("");
}

export function showDailyDebrief({
    completedSol,
    beforeState,
    afterState,
    simulationResults,
    decision
}) {

    const overlay = document.querySelector("#daily-debrief-screen");
    const page = document.querySelector("#daily-debrief-page");
    const content = document.querySelector("#daily-debrief-content");
    const continueButton = document.querySelector("#daily-debrief-continue");

    if (!overlay || !page || !content || !continueButton) {
        console.error("Daily debrief interface was not found.");
        return Promise.resolve(false);
    }

    const startResources = getDayStartResources(beforeState, decision);
    const endResources = afterState.resources ?? {};

    const objectiveCount =
        Number(Boolean(afterState.objectives?.geologicalResearch)) +
        Number(Boolean(afterState.objectives?.environmentalResearch));

    const dayResult = afterState.mission.status === "failure"
        ? {
            kicker: "MISSION CONTROL · EMERGENCY REVIEW",
            title: "The crew could not continue safely.",
            description: "Review the systems below to understand what happened."
        }
        : {
            kicker: "MISSION CONTROL · DAILY REVIEW",
            title: `Mars day ${completedSol} debrief`,
            description: "Here is what changed at your outpost today and why."
        };

    const decisionResourceChanges = RESOURCE_ORDER
        .filter(resource => Number(decision?.resourceChanges?.[resource.key] ?? 0) !== 0)
        .map(resource => {
            const amount = Number(decision.resourceChanges[resource.key]);
            return `${resource.label} ${signed(amount)} units`;
        });

    const decisionChangesMarkup = decisionResourceChanges.length
        ? `<small class="debrief-decision-costs">Resource change from your choice: ${escapeHTML(decisionResourceChanges.join(" · "))}</small>`
        : "";

    const operations = getOperationSummary(simulationResults, afterState);

    const allocation = simulationResults?.powerAllocation;
    const bonusInsights = simulationResults?.powerAllocation?.scienceInsightsGained ?? 0;

    const crewCondition = afterState.crew?.condition ?? "unknown";
    const crewLabel = crewCondition
        .replaceAll("-", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());

    const resultStatus = afterState.mission.status === "failure"
        ? "MISSION ENDED"
        : afterState.mission.status === "success"
            ? "ALL SCIENCE GOALS COMPLETE"
            : afterState.mission.status === "partial-success"
                ? "SEVEN DAYS COMPLETE"
                : "DAY COMPLETE";

    page.dataset.result = afterState.mission.status;

    content.innerHTML = `
        <header class="daily-debrief-heading">
            <div>
                <span class="debrief-kicker">${escapeHTML(dayResult.kicker)}</span>
                <h1 id="daily-debrief-title">${escapeHTML(dayResult.title)}</h1>
                <p>${escapeHTML(dayResult.description)}</p>
            </div>
            <span class="debrief-result-badge">${escapeHTML(resultStatus)}</span>
        </header>

        <section class="daily-debrief-decision">
            <span class="eyebrow">YOUR DECISION</span>
            <h2>${escapeHTML(decision?.label ?? "No decision recorded")}</h2>
            <p>${escapeHTML(decision?.explanation ?? "No decision explanation was recorded.")}</p>
            ${decisionChangesMarkup}
        </section>

        <section class="daily-debrief-resource-section">
            <div class="debrief-section-heading">
                <div>
                    <span class="eyebrow">RESOURCE REPORT</span>
                    <h2>What changed today?</h2>
                </div>
                <small>Start of day → End of day</small>
            </div>
            <div class="debrief-resource-grid">
                ${renderResourceSummary(startResources, endResources)}
            </div>
        </section>

        <section class="daily-debrief-operations">
            <div class="debrief-section-heading">
                <div>
                    <span class="eyebrow">OUTPOST SYSTEMS</span>
                    <h2>Why did it change?</h2>
                </div>
            </div>
            <div class="debrief-operation-list">
                ${renderOperations(operations)}
            </div>
        </section>

        <section class="daily-debrief-crew">
            <div>
                <span class="eyebrow">CREW CONDITION</span>
                <strong>${escapeHTML(crewLabel)}</strong>
                <small>${Number(afterState.crew?.count ?? 0)} astronauts</small>
            </div>
            <div>
                <span class="eyebrow">SCIENCE GOALS</span>
                <strong>${objectiveCount} / 2</strong>
                <small>Goals completed</small>
            </div>
            <div>
                <span class="eyebrow">BONUS SCIENCE</span>
                <strong>${Number(afterState.systems?.scienceInsightPoints ?? 0)}</strong>
                <small>${bonusInsights > 0 ? `+${bonusInsights} today` : "Insight points"}</small>
            </div>
        </section>

        <p class="daily-debrief-footnote">
            Game risk points and resource rules are simplified learning values, not real measurements of Mars conditions.
        </p>
    `;

    continueButton.textContent =
        afterState.mission.status === "playing"
            ? `CONTINUE TO MARS DAY ${Math.min(completedSol + 1, afterState.mission.totalSols)}`
            : "VIEW FINAL MISSION RESULT";

    overlay.hidden = false;
    document.body.classList.add("daily-debrief-open");
    continueButton.focus();

    return new Promise(resolve => {

        continueButton.onclick = () => {

            overlay.hidden = true;
            document.body.classList.remove("daily-debrief-open");

            resolve(true);

        };

    });
}
