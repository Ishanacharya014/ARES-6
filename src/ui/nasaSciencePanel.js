
/*
    ARES-6
    NASA SCIENCE PANEL

    Displays historical NASA research inside the game.
*/


// =====================================
// 1. SAFELY FORMAT DISPLAY TEXT
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
// 2. RENDER NASA SCIENCE PANEL
// =====================================

export function renderNasaSciencePanel(result) {

    const panel = document.querySelector(
        "#nasa-science-panel-root"
    );


    if (!panel) {

        console.error("NASA Science Panel container not found.");

        return false;

    }


    // Handle missing or invalid data.
    if (
        !result?.success ||
        !result.radiation ||
        !Array.isArray(result.sources)
    ) {

        panel.innerHTML = `

            <span class="eyebrow">NASA SCIENCE DATA</span>

            <h3>Science data unavailable</h3>

            <p>
                Historical NASA data could not be loaded.
                The mission simulation can continue.
            </p>

        `;

        return false;

    }


    const dataset = result.radiation.dataset;

    const observation =
        result.radiation.observations.find(
            item => item.id === "mars-gcr-average-2012-2013"
        ) ?? result.radiation.observations[0];


    if (!observation) {

        panel.textContent = "No radiation observations available.";

        return false;

    }


    // Find the sources associated with the dataset.
    const relevantSources = result.radiation.sourceIds
        .map(id => result.sources.find(source => source.id === id))
        .filter(source => source && /^https:\/\//i.test(source.url));


    // Prepare source links.
    const sourceLinks = relevantSources.map(source => `

        <a
            href="${escapeHTML(source.url)}"
            target="_blank"
            rel="noopener noreferrer"
        >
            ${escapeHTML(source.title)}
        </a>

    `).join("");


    // =====================================
    // 3. BUILD THE SCIENCE PANEL
    // =====================================

    panel.innerHTML = `

        <div class="nasa-data-header">

            <span class="nasa-data-badge">
                NASA HISTORICAL DATA
            </span>

            <span class="nasa-data-status">
                NOT LIVE
            </span>

        </div>


        <span class="eyebrow">
            ${escapeHTML(dataset.rover)} · ${escapeHTML(dataset.instrument)}
        </span>


        <h3 class="nasa-science-title">
            ${escapeHTML(observation.name)}
        </h3>


        <div class="nasa-radiation-measurement">

            <strong>
                ${escapeHTML(observation.value)}
            </strong>

            <span>
                ${escapeHTML(observation.unitSymbol)}
            </span>

        </div>


        <p class="nasa-science-description">

            ${escapeHTML(observation.educationalExplanation)}

        </p>


        <div class="nasa-science-detail">

            <span>WHERE WAS THIS MEASURED?</span>

            <p>
                ${escapeHTML(dataset.rover)} rover,
                on the surface of ${escapeHTML(dataset.target)}.
            </p>

        </div>


        <div class="nasa-science-detail">

            <span>OBSERVATION PERIOD</span>

            <p>
                ${escapeHTML(dataset.observationPeriod)}.
            </p>

        </div>


        <div class="nasa-science-warning">

            <strong>Important</strong>

            <p>
                This is a historical NASA measurement, not a
                current Mars reading or a prediction for our outpost.
            </p>

            <p>
                ARES-6 radiation risk points are simplified
                game values, not measured radiation doses.
            </p>

        </div>


        <div class="nasa-source-section">

            <span>SCIENTIFIC SOURCES</span>

            ${sourceLinks || "<p>Source links unavailable.</p>"}

        </div>

    `;


    return true;

}
