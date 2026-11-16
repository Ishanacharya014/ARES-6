
/*
    ARES-6
    FACILITY PANEL

    Displays live information about outpost facilities.
*/
// Stores the currently inspected facility.
let activeFacilityId = null;

// =====================================
// 1. FACILITY DESCRIPTIONS
// =====================================

const facilityDescriptions = {

    habitat: {
        title: "Habitat — Crew Home",
        description:
            "This is the crew's home on Mars. It gives the astronauts a protected place to live. " +
            "Machines inside help make the air safe to breathe.",
        scienceFact:
            "People cannot breathe the thin air on Mars. The habitat needs special machines " +
            "to give the crew safe air."
    },

    solarArray: {
        title: "Solar Station — Power Panels",
        description:
            "These panels use sunlight to make electricity for the outpost. " +
            "The electricity powers important equipment.",
        scienceFact:
            "Dust can cover the panels and block sunlight. " +
            "When that happens, they make less electricity."
    },

    greenhouse: {
        title: "Greenhouse — Food Garden",
        description:
            "This is the outpost's food garden. The crew can grow plants here " +
            "so they have another way to get food.",
        scienceFact:
            "Plants need water, light, and nutrients from the soil or growing material. " +
            "The crew must give them the right conditions."
    },

    shelter: {
        title: "Storm Shelter — Radiation Shelter",
        description:
            "The crew can go here when there is a warning about space radiation. " +
            "The shelter is designed to give them extra protection.",
        scienceFact:
            "Some materials, including water, can help block certain kinds of space radiation. " +
            "Real shelters need carefully planned shielding."
    },

    antenna: {
        title: "Communication Station — Talk to Earth",
        description:
            "The antenna helps the crew send messages to Earth " +
            "and receive replies from mission control.",
        scienceFact:
            "Earth and Mars are very far apart. A message can take several minutes " +
            "or more to travel one way."
    },

    rover: {
        title: "Science Rover — Robot Explorer",
        description:
            "This robot explorer travels over the surface of Mars. " +
            "It helps the crew study rocks, soil, and the land around the outpost.",
        scienceFact:
            "The rover carries special tools that help scientists learn about " +
            "Martian rocks, soil, and the planet around them."
    }

};


// =====================================
// 2. SAFE HTML TEXT
// =====================================

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
// 3. FORMAT STATUS TEXT
// =====================================

function formatStatus(value) {

    if (typeof value !== "string") {

        return "Unknown";

    }

    return value
        .replaceAll("-", " ")
        .replace(/\b\w/g, character => character.toUpperCase());

}


// =====================================
// 4. GET LIVE FACILITY INFORMATION
// =====================================

function getFacilityInformation(facilityId, gameState) {

    const details = facilityDescriptions[facilityId];

    if (!details) {
        return null;
    }


    const facility = gameState.facilities;

    let statusLabel = "Facility Status";

    let status = "Unknown";

    let extraDetails = [];


    // =====================================
    // HABITAT
    // =====================================

    if (facilityId === "habitat") {

        const operational =
            facility.habitat.operational;

        statusLabel = "Crew Home status";

        status = operational
            ? "Working"
            : "Needs fixing";


        extraDetails = [

            {
                label: "Breathing air",
                value: ({ good: "Good", "needs-attention": "Needs checking", critical: "Not working" })[gameState.systems.airStatus] ?? "Unknown"
            },

            {
                label: "Days with an air-system problem",
                value: gameState.systems.airFailureSols ?? 0
            },

            {
                label: "People living here",
                value: gameState.crew.count
            }

        ];

    }


    // =====================================
    // SOLAR ARRAY
    // =====================================

    else if (facilityId === "solarArray") {

        const dustLevel =
            facility.solarArray.dustLevel;

        statusLabel = "Solar panel status";

        status = dustLevel === "clean" ? "Clean" : "Dusty";


        extraDetails = [

            {
                label: "Power available",
                value: `${gameState.resources.power} units`
            },

            {
                label: "Panel cleaning",
                value: dustLevel === "clean"
                    ? "No cleaning needed"
                    : "Needs cleaning"
            }

        ];

    }


    // =====================================
    // GREENHOUSE
    // =====================================

    else if (facilityId === "greenhouse") {

        const greenhouse = facility.greenhouse;

        const growing =
            greenhouse.cropStatus === "growing";

        statusLabel = "Plant status";

        status = growing
            ? "Growing"
            : greenhouse.cropStatus === "empty" ? "Ready to plant" : formatStatus(greenhouse.cropStatus);


        extraDetails = [

            {
                label: "Mars days until food is ready",
                value: growing
                    ? `${greenhouse.solsUntilHarvest} Mars day(s)`
                    : "No crops growing"
            },

            {
                label: "Harvests completed",
                value: greenhouse.totalHarvests
            },

            {
                label: "Food in storage",
                value: `${gameState.resources.food} units`
            }

        ];

    }


    // =====================================
    // STORM SHELTER
    // =====================================

    else if (facilityId === "shelter") {

        const shelter = facility.shelter;

        const shieldingActive =
            shelter.shieldingLevel !== "none";

        statusLabel = "Extra protection";

        status = shieldingActive
            ? "Extra protection added"
            : "No extra protection";


        extraDetails = [

            {
                label: "Protection level",
                value: formatStatus(shelter.shieldingLevel)
            },

            {
                label: "Water set aside",
                value: `${shelter.waterAllocated} units`
            },

            {
                label: "Water left",
                value: `${gameState.resources.water} units`
            }

        ];

    }


    // =====================================
    // COMMUNICATION ANTENNA
    // =====================================

    else if (facilityId === "antenna") {

        const operational =
            gameState.supportAssets.antennaOperational;

        const pending =
            gameState.communication.pendingReply;

        statusLabel = "Earth connection";

        status = operational
            ? "Working"
            : "Not working";


        extraDetails = [

            {
                label: "Reply from Earth",
                value: pending
                    ? `Expected on Mars day ${pending.deliverOnSol}`
                    : "No pending reply"
            },

            {
                label: "Messages from Earth received",
                value: gameState.communication.receivedMessages.length
            }

        ];

    }


    // =====================================
    // SCIENCE ROVER
    // =====================================

    else if (facilityId === "rover") {

        const available =
            gameState.supportAssets.roverAvailable;

        statusLabel = "Rover status";

        status = available
            ? "Ready to explore"
            : "Not available";


        extraDetails = [

            {
                label: "Study a Martian rock",
                value: gameState.objectives.geologicalResearch
                    ? "Done"
                    : "Not started"
            },

            {
                label: "Study Mars's environment",
                value: gameState.objectives.environmentalResearch
                    ? "Done"
                    : "Not started"
            }

        ];

    }


    return {

        ...details,

        statusLabel,

        status,

        extraDetails

    };

}


// =====================================
// 5. DISPLAY FACILITY INFORMATION
// =====================================

export function showFacilityPanel(facilityId, gameState) {

    const panel = document.querySelector(
        "#facility-panel-root"
    );


    if (!panel) {

        console.error("Facility panel container not found.");

        return;

    }


    if (!gameState?.facilities) {

        console.error("Invalid game state.");

        return;

    }


    const facility = getFacilityInformation(
        facilityId,
        gameState
    );


    if (!facility) {

        console.error("Unknown facility:", facilityId);

        return;

    }
    activeFacilityId = facilityId;


    // =====================================
    // BUILD FACILITY PANEL
    // =====================================

    panel.innerHTML = `

        <div class="facility-panel-heading">

            <div>

                <span class="eyebrow">
                    OUTPOST PLACE
                </span>

                <h3>
                    ${escapeHTML(facility.title)}
                </h3>

            </div>


            <button
                type="button"
                class="facility-close"
                aria-label="Close facility information"
            >
                ×
            </button>

        </div>


        <div class="facility-status">

            <span>
                ${escapeHTML(facility.statusLabel)}
            </span>

            <strong class="facility-status-value">
                ${escapeHTML(facility.status)}
            </strong>

        </div>


        <p class="facility-description">

            ${escapeHTML(facility.description)}

        </p>


        <div class="facility-detail-list">

            ${facility.extraDetails.map(detail => `

                <div class="facility-detail-row">

                    <span>
                        ${escapeHTML(detail.label)}
                    </span>

                    <strong>
                        ${escapeHTML(detail.value)}
                    </strong>

                </div>

            `).join("")}

        </div>


        <div class="science-fact">

            <span>DID YOU KNOW?</span>

            <p>
                ${escapeHTML(facility.scienceFact)}
            </p>

        </div>

    `;


    // Show panel.
    panel.hidden = false;


    // =====================================
    // CLOSE FACILITY PANEL
    // =====================================

    const closeButton = panel.querySelector(
        ".facility-close"
    );


    closeButton.addEventListener("click", () => {

    panel.hidden = true;

    panel.innerHTML = "";

    activeFacilityId = null;

});
return true;
}

// =====================================
// REFRESH CURRENT FACILITY PANEL
// =====================================

export function refreshFacilityPanel(gameState) {

    const panel = document.querySelector(
        "#facility-panel-root"
    );


    // Nothing is currently being inspected.
    if (!activeFacilityId || !panel || panel.hidden) {

        return false;

    }


    // Re-render the same facility using updated game state.
    return showFacilityPanel(
        activeFacilityId,
        gameState
    );

}
