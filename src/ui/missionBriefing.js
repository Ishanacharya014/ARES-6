/*
    ARES-6
    FIRST-TIME MISSION BRIEFING

    Shows a short, dismissible introduction once per browser.
*/

const BRIEFING_STORAGE_KEY = "ares6-mission-briefing-seen-v1";

export function initializeMissionBriefing() {

    const briefing = document.querySelector("#mission-briefing");

    if (!briefing) {
        console.error("Mission briefing container not found.");
        return false;
    }

    // Returning players who have completed or skipped the briefing
    // go directly to the mission on later visits.
    try {
        if (window.localStorage.getItem(BRIEFING_STORAGE_KEY) === "true") {
            return true;
        }
    } catch (error) {
        // If browser storage is unavailable, keep the briefing usable.
        console.warn("Mission briefing preference could not be read.", error);
    }

    const startButton = briefing.querySelector("#mission-briefing-start");
    const skipButton = briefing.querySelector("#mission-briefing-skip");

    if (!startButton || !skipButton) {
        console.error("Mission briefing controls are missing.");
        return false;
    }

    const previousFocus = document.activeElement;

    briefing.hidden = false;
    document.body.classList.add("briefing-open");

    function dismissBriefing() {

        briefing.hidden = true;
        document.body.classList.remove("briefing-open");

        try {
            window.localStorage.setItem(BRIEFING_STORAGE_KEY, "true");
        } catch (error) {
            console.warn("Mission briefing preference could not be saved.", error);
        }

        if (previousFocus instanceof HTMLElement) {
            previousFocus.focus();
        }
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

    startButton.focus();

    return true;
}
