
import { showFacilityPanel } from "./facilityPanel.js";


// =====================================
// INITIALIZE OUTPOST INTERACTIONS
// =====================================

export function initializeOutpost(gameState) {

    const map = document.querySelector("#outpost-map");


    if (!map) {

        console.error("Outpost map not found.");

        return;

    }


    if (!gameState) {

        console.error("Game state was not provided to the outpost.");

        return;

    }


    // Listen for facility clicks.
    map.addEventListener("click", (event) => {

        const target = event.target;


        if (!(target instanceof Element)) {
            return;
        }


        // Find the clicked facility button.
        const facilityButton =
            target.closest("[data-facility]");


        if (
            !facilityButton ||
            !map.contains(facilityButton)
        ) {

            return;

        }


        // Get facility identifier.
        const facilityId = facilityButton.dataset.facility;


        // Display live facility information.
        showFacilityPanel(facilityId, gameState);


        console.log("Selected facility:", facilityId);

    });

}
