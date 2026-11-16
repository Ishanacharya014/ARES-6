
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

            <h3>NASA science data is unavailable</h3>

            <p>
                We could not load the older NASA measurements. You can still play the mission.
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

        panel.textContent = "No radiation measurements are available.";

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
                PAST MEASUREMENT
            </span>

        </div>


        <span class="eyebrow">
            ${escapeHTML(dataset.rover)} · Radiation Detector
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

            <span>WHERE DID NASA MEASURE IT?</span>

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
                NASA collected this measurement in the past. It is not a live reading
                and it does not tell us exactly what our game outpost would experience.
            </p>

            <p>
                The radiation points in ARES-6 are only part of the game. They are not
                real radiation measurements.
            </p>

        </div>


        <div class="nasa-source-section">

            <span>SCIENTIFIC SOURCES</span>

            ${sourceLinks || "<p>Source links unavailable.</p>"}

        </div>

    `;


    return true;

}

// =====================================
// RENDER LIVE DONKI INFORMATION
// =====================================

export function renderDonkiLivePanel(result) {

    const panel = document.querySelector(
        "#donki-live-panel-root"
    );


    if (!panel) {

        console.error("DONKI panel container not found.");

        return false;

    }


    // Handle an unavailable API.
    if (!result?.success) {

        panel.innerHTML = `

            <span class="eyebrow">SPACE WEATHER UPDATE</span>

            <span class="nasa-data-status">UNAVAILABLE</span>

            <h3>Space-weather update unavailable</h3>

            <p>
                ${escapeHTML(result?.message)}
            </p>

            <div class="nasa-science-warning">

                <p>
                    The older NASA Mars measurements are still available above.
                </p>

                <p>
                    You can keep playing even when the internet is not working.
                </p>

            </div>

        `;

        return false;

    }


    const notifications = result.notifications || [];

    const fetchedAt = new Date(result.fetchedAt);

    const formattedTime = Number.isNaN(fetchedAt.getTime())
        ? "Unknown"
        : fetchedAt.toLocaleString();


    // =====================================
    // DISPLAY NO NOTIFICATIONS
    // =====================================

    if (notifications.length === 0) {

        panel.innerHTML = `

            <div class="nasa-data-header">

                <span class="eyebrow">SPACE WEATHER UPDATE</span>

                <span class="nasa-data-status">
                    ${result.fromCache ? "SAVED COPY" : "CHECKED NOW"}
                </span>

            </div>

            <h3>No solar particle alerts found</h3>

            <p>
                NASA found no alerts about tiny particles from the Sun in the last seven days.
            </p>

            <p class="donki-update-time">
                Retrieved: ${escapeHTML(formattedTime)}
            </p>

            <div class="nasa-science-warning">

                <p>
                    Radiation can still be near Mars. This only means NASA found no alerts
                    of this type during these seven days.
                </p>

            </div>

            <p class="donki-source-label">
                Source: NASA CCMC DONKI
            </p>

        `;

        return true;

    }


    // =====================================
    // DISPLAY NOTIFICATIONS
    // =====================================

    panel.innerHTML = `

        <div class="nasa-data-header">

            <span class="eyebrow">SPACE WEATHER UPDATE</span>

            <span class="nasa-data-status">
                ${result.fromCache ? "SAVED COPY" : "CHECKED NOW"}
            </span>

        </div>

        <h3>
            Sun particle alerts
        </h3>

        <p class="donki-introduction">

            NASA found ${notifications.length} alert(s) about tiny particles from the Sun
            between ${escapeHTML(result.startDate)} and ${escapeHTML(result.endDate)}.

        </p>


        <div class="donki-notification-list">

            ${notifications.slice(0, 3).map(notification => `

                <article class="donki-notification">

                    <span class="donki-type">
                        ${notification.type === "SEP" ? "SUN PARTICLE ALERT" : escapeHTML(notification.type)}
                    </span>

                    <strong>
                        ${escapeHTML(notification.issueTime || "Time unavailable")}
                    </strong>

                    <p>
                        NASA has posted a science report about fast-moving particles from the Sun.
                        The full report is written for readers who want the technical details.
                    </p>

                    ${
                        notification.url
                            ? `
                                <a
                                    href="${escapeHTML(notification.url)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Read full NASA alert ↗
                                </a>
                            `
                            : ""
                    }

                </article>

            `).join("")}

        </div>


        <p class="donki-update-time">
            Retrieved: ${escapeHTML(formattedTime)}
        </p>


        <div class="nasa-science-warning">

            <strong>Remember</strong>

            <p>
                These alerts tell us about activity from the Sun. They are not
                radiation measurements taken on Mars, and they do not tell us
                how much radiation the ARES-6 crew receives.
            </p>

        </div>


        <p class="donki-source-label">
            Source: NASA DONKI · Sun particle alerts
        </p>

    `;


    return true;

}
