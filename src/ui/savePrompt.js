/*
    ARES-6
    SAVE AND RESUME PROMPT

    Offers the player a choice when a valid local mission save exists.
*/

function formatSavedTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Time unavailable";
    }

    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

export function showSavePrompt(saveResult) {

    if (!saveResult || !["valid", "invalid"].includes(saveResult.status)) {
        return Promise.resolve("new");
    }

    let overlay = document.querySelector("#save-resume-screen");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "save-resume-screen";
        overlay.className = "save-resume-overlay";
        document.body.append(overlay);
    }

    const isValid = saveResult.status === "valid";
    const gameState = saveResult.gameState;
    const isComplete = isValid && gameState.mission.status !== "playing";

    const scenarioLabel =
        gameState?.mission?.scenarioId === "may-2024-solar-storm"
            ? "May 2024 Solar Storm"
            : "Standard Mars Mission";

    const statusLabel = isComplete
        ? "Mission finished"
        : "Mission in progress";

    const details = isValid
        ? `
            <div class="save-resume-summary">
                <div>
                    <span>MISSION</span>
                    <strong>${scenarioLabel}</strong>
                </div>
                <div>
                    <span>PROGRESS</span>
                    <strong>Mars day ${gameState.mission.currentSol} of ${gameState.mission.totalSols}</strong>
                </div>
                <div>
                    <span>STATUS</span>
                    <strong>${statusLabel}</strong>
                </div>
                <div>
                    <span>LAST SAVED</span>
                    <strong>${formatSavedTime(saveResult.savedAt)}</strong>
                </div>
            </div>
            <p class="save-resume-resources">
                Power: ${gameState.resources.power} ·
                Water: ${gameState.resources.water} ·
                Food: ${gameState.resources.food}
            </p>
        `
        : `
            <p class="save-resume-warning">
                ${saveResult.message || "The previous save cannot be opened."}
                You can start a new mission. The damaged save will be replaced.
            </p>
        `;

    overlay.innerHTML = `
        <section
            class="save-resume-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-resume-title"
            aria-describedby="save-resume-description"
        >
            <div class="save-resume-brand">
                <span>A</span>
                <div>
                    <strong>ARES-6</strong>
                    <small>MISSION CONTROL</small>
                </div>
            </div>

            <div class="save-resume-hero">
                <span class="eyebrow">${isValid ? "MISSION SAVE FOUND" : "SAVE RECOVERY"}</span>
                <h1 id="save-resume-title">
                    ${isValid
                        ? isComplete
                            ? "Your last mission is complete."
                            : "Welcome back, Commander."
                        : "We couldn't read your last save."}
                </h1>
                <p id="save-resume-description">
                    ${isValid
                        ? isComplete
                            ? "You can review your final mission report or begin a fresh campaign."
                            : "Your mission progress was saved in this browser. Continue where you left off or start again."
                        : "The saved data is damaged or from an older version. Your new mission can still begin normally."}
                </p>
            </div>

            ${details}

            <div class="save-resume-actions">
                ${isValid
                    ? `
                        <button type="button" class="save-resume-continue" id="save-resume-continue">
                            ${isComplete ? "VIEW MISSION RESULT" : "CONTINUE MISSION"}
                        </button>
                    `
                    : ""}
                <button type="button" class="save-resume-new" id="save-resume-new">
                    START NEW MISSION
                </button>
            </div>

            <small class="save-resume-footnote">
                Your progress is stored only in this browser.
            </small>
        </section>
    `;

    overlay.hidden = false;

    const continueButton = overlay.querySelector("#save-resume-continue");
    const newButton = overlay.querySelector("#save-resume-new");

    (continueButton ?? newButton)?.focus();

    return new Promise(resolve => {

        if (continueButton) {
            continueButton.addEventListener("click", () => {
                overlay.remove();
                resolve("continue");
            });
        }

        newButton.addEventListener("click", () => {

            if (
                isValid &&
                !window.confirm(
                    "Start a new ARES-6 mission? Your saved progress will be replaced."
                )
            ) {
                return;
            }

            overlay.remove();
            resolve("new");

        });

        overlay.addEventListener("keydown", event => {

            if (event.key === "Escape") {
                event.preventDefault();
                return;
            }

            if (event.key === "Tab") {

                const focusable = [
                    continueButton,
                    newButton
                ].filter(button => button && !button.disabled);

                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }

            }

        });

    });
}
