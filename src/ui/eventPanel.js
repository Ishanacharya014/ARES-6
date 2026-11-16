
/*
    ARES-6
    EVENT PANEL

    Displays daily events, player decisions
    and the End Mars day control.
*/

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


// =====================================
// RENDER EVENT PANEL
// =====================================

export function renderEventPanel(
    event,
    onChoiceSelected,
    onEndSol
) {

    const panel = document.querySelector("#event-panel-root");

    if (!panel) {
        console.error("Event panel container not found.");
        return false;
    }

    if (
        !event ||
        !Array.isArray(event.choices) ||
        event.choices.length !== 2
    ) {
        console.error("Invalid mission event.");
        return false;
    }


    const categoryLabels = {
        greenhouse: "FOOD GARDEN",
        power: "POWER",
        research: "SCIENCE",
        radiation: "SPACE RADIATION",
        "life-support": "AIR SYSTEM"
    };

    const categoryLabel =
        categoryLabels[event.category] ??
        String(event.category || "MISSION").toUpperCase();

    const historicalRecord = event.historicalRecord;

    const historicalRecordMarkup = historicalRecord
        ? `
            <section class="historical-storm-card" aria-label="NASA historical solar storm record">
                <div class="historical-storm-header">
                    <span>NASA HISTORICAL EVENT</span>
                    <span>ARCHIVED</span>
                </div>

                <strong class="historical-storm-date">
                    ${escapeHTML(historicalRecord.date)} · Curiosity Mars day ${escapeHTML(historicalRecord.curiositySol)}
                </strong>

                <div class="historical-storm-dose">
                    <strong>${Number(historicalRecord.estimatedAstronautDoseMicrogray).toLocaleString("en-US")}</strong>
                    <span>µGy estimated astronaut dose near Curiosity</span>
                </div>

                <p>
                    ${escapeHTML(historicalRecord.doseExplanation)}
                </p>

                <p>
                    The solar flare was later estimated at
                    <strong>${escapeHTML(historicalRecord.flareClassEstimate)}</strong>.
                    ${escapeHTML(historicalRecord.radFinding)}
                </p>

                <p class="historical-storm-note">
                    ${escapeHTML(historicalRecord.scienceNote)}
                </p>

                <p class="historical-storm-game-note">
                    ${escapeHTML(historicalRecord.gameModelNote)}
                </p>

                <a
                    href="${/^https:\/\//i.test(historicalRecord.sourceUrl) ? escapeHTML(historicalRecord.sourceUrl) : "#"}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Read the NASA report ↗
                </a>
            </section>
        `
        : "";

    panel.innerHTML = `

        <span class="eyebrow">
            MARS DAY ${String(event.sol).padStart(2, "0")}
            · ${escapeHTML(categoryLabel)}
        </span>

        <h3 class="event-title">
            ${escapeHTML(event.title)}
        </h3>

        <p class="event-description">
            ${escapeHTML(event.description)}
        </p>

        <div class="event-science-fact">

            <span>DID YOU KNOW?</span>

            <p>${escapeHTML(event.scienceFact)}</p>

        </div>

        ${historicalRecordMarkup}

        <div class="event-decision-heading">
            YOUR CHOICE
        </div>

        <div class="event-choice-list">

            ${event.choices.map((choice, index) => `

                <button
                    type="button"
                    class="event-choice-button"
                    data-choice-index="${index}"
                >

                    <strong>
                        ${index === 0 ? "A" : "B"}.
                        ${escapeHTML(choice.label)}
                    </strong>

                    <span>
                        ${escapeHTML(choice.description)}
                    </span>

                </button>

            `).join("")}

        </div>


        <div
            class="event-feedback"
            id="event-feedback"
            hidden
            aria-live="polite"
        ></div>


        <button
            type="button"
            class="end-sol-button"
            id="end-sol-button"
            hidden
            disabled
        >
            END MARS DAY
        </button>

        <small
            class="end-sol-help"
            id="end-sol-help"
        >
            Choose one option to continue.
        </small>

    `;


    const buttons = panel.querySelectorAll(
        ".event-choice-button"
    );

    const feedback = panel.querySelector("#event-feedback");

    const endButton = panel.querySelector("#end-sol-button");

    const endHelp = panel.querySelector("#end-sol-help");


    let decisionSubmitted = false;


    // =====================================
    // HANDLE PLAYER DECISION
    // =====================================

    buttons.forEach(button => {

        button.addEventListener("click", async () => {

            if (decisionSubmitted) {
                return;
            }


            const index = Number(button.dataset.choiceIndex);

            const selectedChoice = event.choices[index];

            if (!selectedChoice) {
                return;
            }


            // Temporarily prevent repeated clicks.
            buttons.forEach(item => {
                item.disabled = true;
            });


            try {

                const result = await onChoiceSelected(
                    selectedChoice,
                    event
                );


                if (!result?.success) {

                    feedback.hidden = false;

                    feedback.textContent =
                        result?.message || "Decision could not be processed.";

                    feedback.className = "event-feedback error";

                    // Allow the player to try again.
                    buttons.forEach(item => {
                        item.disabled = false;
                    });

                    return;

                }


                decisionSubmitted = true;

                button.classList.add("is-selected");


                feedback.hidden = false;

                feedback.textContent =
                    result.message ||
                    "Choice saved.";

                feedback.className = "event-feedback success";


                // Allow the player to end the Sol.
                endButton.hidden = false;

                endButton.disabled = false;

                endHelp.textContent =
                    "Your choice is saved. End this Mars day to continue.";

            } catch (error) {

                console.error("Decision error:", error);

                feedback.hidden = false;

                feedback.textContent =
                    "Something went wrong. Please try again.";

                feedback.className = "event-feedback error";

                buttons.forEach(item => {
                    item.disabled = false;
                });

            }

        });

    });


    // =====================================
    // HANDLE END MARS DAY
    // =====================================

    endButton.addEventListener("click", async () => {

        if (!decisionSubmitted || typeof onEndSol !== "function") {
            return;
        }


        endButton.disabled = true;

        endButton.textContent = "PROCESSING...";

        try {

            const result = await onEndSol();


            if (!result?.success) {

                endButton.disabled = false;

                endButton.textContent = "END MARS DAY";

                feedback.hidden = false;

                feedback.textContent =
                    result?.message || "Could not complete this Mars day.";

                feedback.className = "event-feedback error";

                return;

            }

            // The application loads the next event
            // or displays the final mission result.

        } catch (error) {

            console.error("End Mars day error:", error);

            endButton.disabled = false;

            endButton.textContent = "END MARS DAY";

            feedback.hidden = false;

            feedback.textContent =
                "Something went wrong while finishing this Mars day.";

            feedback.className = "event-feedback error";

        }

    });


    return true;

}
