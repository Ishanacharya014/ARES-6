
const facilityDetails = {

    habitat: {
        title: "Habitat",
        statusLabel: "Air System",
        status: "Good",

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
        statusLabel: "Panel Condition",
        status: "Clean",

        description:
            "Solar panels collect sunlight and turn it into " +
            "electricity for our Mars outpost.",

        scienceFact:
            "Dust covering solar panels can reduce the " +
            "amount of sunlight they receive."
    },

    greenhouse: {
        title: "Greenhouse",
        statusLabel: "Crop Status",
        status: "Empty",

        description:
            "The greenhouse helps astronauts grow food. " +
            "Plants need water, light and the right conditions.",

        scienceFact:
            "Growing plants in space requires careful control " +
            "of water, light and nutrients."
    },

    shelter: {
        title: "Storm Shelter",
        statusLabel: "Extra Shielding",
        status: "Not added",

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
        statusLabel: "Connection",
        status: "Operational",

        description:
            "The antenna helps the crew send messages " +
            "and receive information from Earth.",

        scienceFact:
            "Messages between Earth and Mars take several " +
            "minutes or longer to travel one way."
    },

    rover: {
        title: "Science Rover",
        statusLabel: "Mission Status",
        status: "Ready",

        description:
            "The rover explores the Martian surface " +
            "and helps the crew collect scientific information.",

        scienceFact:
            "Mars rovers use scientific instruments to " +
            "study rocks, soil and the Martian environment."
    }

};


// Display information about a selected facility.
export function showFacilityPanel(facilityId) {

    const panel = document.querySelector("#facility-panel-root");

    if (!panel) {
        console.error("Facility panel container not found.");
        return;
    }

    const facility = facilityDetails[facilityId];

    if (!facility) {
        console.error("Unknown facility:", facilityId);
        return;
    }

    panel.innerHTML = `
        <div class="facility-panel-heading">

            <div>
                <span class="eyebrow">FACILITY INSPECTION</span>
                <h3>${facility.title}</h3>
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
            <span>${facility.statusLabel}</span>
            <strong>${facility.status}</strong>
        </div>

        <p class="facility-description">
            ${facility.description}
        </p>

        <div class="science-fact">

            <span>SCIENCE FACT</span>

            <p>${facility.scienceFact}</p>

        </div>

    `;

    panel.hidden = false;

    const closeButton = panel.querySelector(".facility-close");

    closeButton.addEventListener("click", () => {
        panel.hidden = true;
        panel.innerHTML = "";
    });

}
