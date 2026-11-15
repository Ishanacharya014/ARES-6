
import { showFacilityPanel } from "./facilityPanel.js";

export function initializeOutpost() {

    const map = document.querySelector("#outpost-map");

    if (!map) {
        console.error("Outpost map not found.");
        return;
    }

    // Listen for clicks anywhere inside the map.
    map.addEventListener("click", (event) => {

        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        // Find the clicked facility button.
        const facilityButton = target.closest("[data-facility]");

        if (!facilityButton || !map.contains(facilityButton)) {
            return;
        }

        // Get the facility identifier.
        const facilityId = facilityButton.dataset.facility;

        // Display its information.
        showFacilityPanel(facilityId);

        console.log("Selected facility:", facilityId);

    });

}
