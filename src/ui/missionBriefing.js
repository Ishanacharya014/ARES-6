/*
    ARES-6
    MISSION GUIDE

    Shows the mission briefing automatically for first-time players
    and lets players reopen it whenever they need help.
*/

const BRIEFING_STORAGE_KEY = "ares6-mission-briefing-seen-v1";

export function initializeMissionBriefing() {

    const briefing = document.querySelector("#mission-briefing");
    const openButton = document.querySelector("#mission-guide-open");

    if (!briefing) {
        console.error("Mission briefing container not found.");
        return false;
    }

    const startButton = briefing.querySelector("#mission-briefing-start");
    const skipButton = briefing.querySelector("#mission-briefing-skip");

    if (!startButton || !skipButton) {
        console.error("Mission briefing controls are missing.");
        return false;
    }

    let returnFocusElement = null;

    function dismissBriefing() {

        if (briefing.hidden) {
            return;
        }

        briefing.hidden = true;
        document.body.classList.remove("briefing-open");

        try {
            window.localStorage.setItem(BRIEFING_STORAGE_KEY, "true");
        } catch (error) {
            console.warn("Mission briefing preference could not be saved.", error);
        }

        const focusTarget =
            returnFocusElement instanceof HTMLElement
                ? returnFocusElement
                : openButton;

        focusTarget?.focus();
    }

    function openBriefing() {

        if (!briefing.hidden) {
            return;
        }

        returnFocusElement =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        briefing.hidden = false;
        document.body.classList.add("briefing-open");
        startButton.focus();

    }

    // The guide button is always available, including for returning players.
    if (openButton) {
        openButton.addEventListener("click", openBriefing);
    }

    startButton.addEventListener("click", dismissBriefing);
    skipButton.addEventListener("click", dismissBriefing);

    briefing.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            event.preventDefault();
            dismissBriefing();
            return;
        }

        // Keep keyboard focus inside the modal while it is open.
        if (event.key === "Tab") {

            const focusable = [
                startButton,
                skipButton
            ].filter(button => !button.disabled);

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

    // First-time players see the briefing automatically.
    let hasSeenBriefing = false;

    try {
        hasSeenBriefing =
            window.localStorage.getItem(BRIEFING_STORAGE_KEY) === "true";
    } catch (error) {
        console.warn("Mission briefing preference could not be read.", error);
    }

    if (!hasSeenBriefing) {
        openBriefing();
    }

    return true;
}
