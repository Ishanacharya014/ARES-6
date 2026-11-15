
/*
    ARES-6
    FACILITY PANEL

    Displays live information about outpost facilities.
*/


// =====================================
// 1. FACILITY DESCRIPTIONS
// =====================================

const facilityDescriptions = {

    habitat: {

        title: "Habitat",

        description:
            "This is where our four astronauts live. " +
            "The life-support equipment helps provide " +
            "breathable air and a safe indoor environment.",

        scienceFact:
            "Mars has an atmosphere that humans cannot breathe. " +
            "Astronauts need special life-support systems."

    },


    solarArray: {

        title: "Solar Station",

        description:
            "Solar panels collect sunlight and turn it into " +
            "electricity for our Mars outpost.",

        scienceFact:
            "Dust covering solar panels can reduce the " +
            "amount of sunlight they receive."

    },


    greenhouse: {

        title: "Greenhouse",

        description:
            "The greenhouse helps astronauts grow food. " +
            "Plants need water, light and the right conditions.",

        scienceFact:
            "Growing plants in space requires careful control " +
            "of water, light and nutrients."

    },


    shelter: {

        title: "Storm Shelter",

        description:
            "Astronauts can use this protected area during " +
            "dangerous radiation events.",

        scienceFact:
            "Materials containing hydrogen, including water, " +
            "can help protect astronauts from certain " +
            "forms of space radiation."

    },


    antenna: {

        title: "Communication Station",

        description:
            "The antenna helps the crew send messages " +
            "and receive information from Earth.",

        scienceFact:
            "Messages between Earth and Mars can take " +
            "several minutes or longer to travel one way."

    },


    rover: {

        title: "Science Rover",

        description:
            "The rover explores the Martian surface " +
            "and helps the crew collect scientific information.",

        scienceFact:
            "Mars rovers use scientific instruments to " +
            "study rocks, soil and the Martian environment."

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

        statusLabel = "Habitat Condition";

        status = operational
            ? "Operational"
            : "Needs repair";


        extraDetails = [

            {
                label: "Air system",
                value: formatStatus(gameState.systems.airStatus)
            },

            {
                label: "Air failure days",
                value: gameState.systems.airFailureSols ?? 0
            },

            {
                label: "Crew members",
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

        statusLabel = "Panel Condition";

        status = formatStatus(dustLevel);


        extraDetails = [

            {
                label: "Available outpost power",
                value: `${gameState.resources.power} units`
            },

            {
                label: "Panel cleaning",
                value: dustLevel === "clean"
                    ? "Not required"
                    : "Cleaning recommended"
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

        statusLabel = "Crop Status";

        status = growing
            ? "Growing"
            : formatStatus(greenhouse.cropStatus);


        extraDetails = [

            {
                label: "Growth remaining",
                value: growing
                    ? `${greenhouse.solsUntilHarvest} Sol(s)`
                    : "No active crop cycle"
            },

            {
                label: "Completed harvests",
                value: greenhouse.totalHarvests
            },

            {
                label: "Available food",
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

        statusLabel = "Extra Shielding";

        status = shieldingActive
            ? "Basic shielding active"
            : "Not added";


        extraDetails = [

            {
                label: "Shielding level",
                value: formatStatus(shelter.shieldingLevel)
            },

            {
                label: "Allocated water",
                value: `${shelter.waterAllocated} units`
            },

            {
                label: "Available water",
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

        statusLabel = "Connection";

        status = operational
            ? "Operational"
            : "Unavailable";


        extraDetails = [

            {
                label: "Pending Earth reply",
                value: pending
                    ? `Expected on Sol ${pending.deliverOnSol}`
                    : "No pending reply"
            },

            {
                label: "Messages received",
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

        statusLabel = "Mission Status";

        status = available
            ? "Ready"
            : "Unavailable";


        extraDetails = [

            {
                label: "Geological research",
                value: gameState.objectives.geologicalResearch
                    ? "Completed"
                    : "Pending"
            },

            {
                label: "Environmental research",
                value: gameState.objectives.environmentalResearch
                    ? "Completed"
                    : "Pending"
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


    // =====================================
    // BUILD FACILITY PANEL
    // =====================================

    panel.innerHTML = `

        <div class="facility-panel-heading">

            <div>

                <span class="eyebrow">
                    FACILITY INSPECTION
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

            <span>SCIENCE FACT</span>

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

    });

}
