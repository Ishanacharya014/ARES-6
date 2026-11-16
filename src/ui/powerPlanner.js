/*
    ARES-6
    POWER PLANNER UI

    Optional advanced planning: players can assign 2 power units
    to the greenhouse, science rover, or radiation shelter each day.
*/

import { getAvailablePowerBudget } from "../game/powerAllocation.js";

const POWER_PER_SYSTEM = 2;

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

export function renderPowerPlanner(gameState, onSave) {

    const panel = document.querySelector("#power-planner-panel");

    if (!panel) {
        return false;
    }

    const enabled = gameState?.mission?.powerPlanningEnabled === true;

    panel.hidden = !enabled;

    if (!enabled) {
        panel.innerHTML = "";
        return true;
    }

    const allocation = gameState.turn.powerAllocation ?? {
        greenhouse: 0,
        rover: 0,
        shelter: 0,
        total: 0,
        confirmed: false
    };

    const budget = getAvailablePowerBudget(gameState);
    const decisionMade = gameState.turn.decisionMade === true;

    if (!decisionMade) {
        panel.innerHTML = `
            <span class="eyebrow">ADVANCED POWER PLANNING</span>
            <h3>Plan today's extra power</h3>
            <p class="power-planner-intro">
                First choose your main mission action. Then you can assign extra
                power to help one or more outpost systems.
            </p>
            <div class="power-planner-budget">
                <span>Extra power available after today's solar generation</span>
                <strong>${budget} units</strong>
            </div>
            <p class="power-planner-help">
                Life support uses 4 power units automatically. Your saved plan
                is applied when you end the Mars day.
            </p>
        `;
        return true;
    }

    if (allocation.confirmed) {
        const selected = [
            allocation.greenhouse === 2 ? "Greenhouse" : null,
            allocation.rover === 2 ? "Science rover" : null,
            allocation.shelter === 2 ? "Radiation shelter" : null
        ].filter(Boolean);

        panel.innerHTML = `
            <span class="eyebrow">ADVANCED POWER PLANNING</span>
            <h3>Today's power plan is saved</h3>
            <div class="power-planner-budget">
                <span>Power assigned</span>
                <strong>${allocation.total ?? selected.length * 2} / ${budget} units</strong>
            </div>
            <p class="power-planner-saved">
                ${selected.length
                    ? escapeHTML(selected.join(", ")) + " will receive extra power today."
                    : "No extra power was assigned. All available power stays in storage."}
            </p>
            <button type="button" class="power-planner-edit" id="power-plan-edit">
                Edit today's plan
            </button>
            <small class="power-planner-help">
                You must save a plan before ending each Mars day while advanced planning is on.
            </small>
        `;

        panel.querySelector("#power-plan-edit")?.addEventListener("click", () => {
            gameState.turn.powerAllocation.confirmed = false;
            renderPowerPlanner(gameState, onSave);
        });

        return true;
    }

    const greenhouseAvailable =
        gameState.facilities?.greenhouse?.cropStatus === "growing";

    const roverAvailable =
        gameState.supportAssets?.roverAvailable === true;

    const shelterAvailable =
        ["danger", "caution"].includes(gameState.systems?.radiationStatus);

    panel.innerHTML = `
        <span class="eyebrow">ADVANCED POWER PLANNING</span>
        <h3>Where should we use extra power?</h3>
        <p class="power-planner-intro">
            Each selected system uses 2 power units. Choose up to three.
            Unused power stays in storage.
        </p>

        <div class="power-planner-budget">
            <span>Extra power available today</span>
            <strong><span id="power-plan-total">0</span> / ${budget} units</strong>
        </div>

        <div class="power-plan-options">
            <label class="power-plan-option ${greenhouseAvailable ? "" : "is-unavailable"}">
                <input
                    type="checkbox"
                    data-power-target="greenhouse"
                    value="2"
                    ${greenhouseAvailable ? "" : "disabled"}
                />
                <span class="power-plan-option-copy">
                    <strong>Greenhouse lighting · 2 units</strong>
                    <small>
                        Adds 6 food units to the next harvest.
                        ${greenhouseAvailable ? "" : "Start growing crops first."}
                    </small>
                </span>
            </label>

            <label class="power-plan-option ${roverAvailable ? "" : "is-unavailable"}">
                <input
                    type="checkbox"
                    data-power-target="rover"
                    value="2"
                    ${roverAvailable ? "" : "disabled"}
                />
                <span class="power-plan-option-copy">
                    <strong>Science rover · 2 units</strong>
                    <small>Adds 1 bonus science insight point to your mission result.</small>
                </span>
            </label>

            <label class="power-plan-option ${shelterAvailable ? "" : "is-unavailable"}">
                <input
                    type="checkbox"
                    data-power-target="shelter"
                    value="2"
                    ${shelterAvailable ? "" : "disabled"}
                />
                <span class="power-plan-option-copy">
                    <strong>Radiation shelter · 2 units</strong>
                    <small>
                        Reduces the game's radiation-risk points by 1 today.
                        ${shelterAvailable ? "" : "Available only during a radiation warning."}
                    </small>
                </span>
            </label>
        </div>

        <div class="power-plan-feedback" id="power-plan-feedback" aria-live="polite">
            Select any available systems, then save your plan.
        </div>

        <button type="button" class="power-plan-save" id="power-plan-save">
            SAVE POWER PLAN
        </button>

        <small class="power-planner-help">
            Life support's 4-unit power use is protected automatically.
        </small>
    `;

    const checkboxes = [
        ...panel.querySelectorAll("[data-power-target]")
    ];

    const totalLabel = panel.querySelector("#power-plan-total");
    const feedback = panel.querySelector("#power-plan-feedback");
    const saveButton = panel.querySelector("#power-plan-save");

    function updateTotal() {

        const total = checkboxes.reduce(
            (sum, checkbox) => sum + (checkbox.checked ? POWER_PER_SYSTEM : 0),
            0
        );

        totalLabel.textContent = String(total);

        const overBudget = total > budget;

        feedback.textContent = overBudget
            ? "This plan uses more power than is available. Remove one selection."
            : total === 0
                ? "No extra power selected. Your power stays in storage."
                : total + " power units will be used when you end this Mars day.";

        feedback.dataset.state = overBudget ? "warning" : "ready";
        saveButton.disabled = overBudget;

    }

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", updateTotal);
    });

    saveButton.addEventListener("click", () => {

        const plan = {};

        checkboxes.forEach(checkbox => {
            plan[checkbox.dataset.powerTarget] =
                checkbox.checked ? POWER_PER_SYSTEM : 0;
        });

        const result = onSave(plan);

        feedback.textContent = result.message;

        if (result.success) {
            renderPowerPlanner(gameState, onSave);
        } else {
            feedback.dataset.state = "warning";
        }

    });

    updateTotal();

    return true;
}
