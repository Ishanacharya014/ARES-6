
/*
    ARES-6
    EVENT PANEL

    Displays daily events, player decisions
    and the End Sol control.
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


    panel.innerHTML = `

        <span class="eyebrow">
            SOL ${String(event.sol).padStart(2, "0")}
            · ${escapeHTML(event.category).toUpperCase()}
        </span>

        <h3 class="event-title">
            ${escapeHTML(event.title)}
        </h3>

        <p class="event-description">
            ${escapeHTML(event.description)}
        </p>

        <div class="event-science-fact">

            <span>SCIENCE FACT</span>

            <p>${escapeHTML(event.scienceFact)}</p>

        </div>

        <div class="event-decision-heading">
            YOUR DECISION
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
            END SOL
        </button>

        <small
            class="end-sol-help"
            id="end-sol-help"
        >
            Select one decision to continue.
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
                    "Decision successfully completed.";

                feedback.className = "event-feedback success";


                // Allow the player to end the Sol.
                endButton.hidden = false;

                endButton.disabled = false;

                endHelp.textContent =
                    "Your decision is complete. End this Sol to continue.";

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
    // HANDLE END SOL
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

                endButton.textContent = "END SOL";

                feedback.hidden = false;

                feedback.textContent =
                    result?.message || "Could not complete this Sol.";

                feedback.className = "event-feedback error";

                return;

            }

            // The application loads the next event
            // or displays the final mission result.

        } catch (error) {

            console.error("End Sol error:", error);

            endButton.disabled = false;

            endButton.textContent = "END SOL";

            feedback.hidden = false;

            feedback.textContent =
                "An error occurred while completing this Sol.";

            feedback.className = "event-feedback error";

        }

    });


    return true;

}
