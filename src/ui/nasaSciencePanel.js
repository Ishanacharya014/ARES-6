
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

            <h3>Live update unavailable</h3>

            <p>
                ${escapeHTML(result?.message)}
            </p>

            <div class="nasa-science-warning">

                <p>
                    Historical NASA radiation information
                    is still available above.
                </p>

                <p>
                    The mission simulation does not depend
                    on an internet connection.
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
                    ${result.fromCache ? "CACHED" : "RETRIEVED"}
                </span>

            </div>

            <h3>No SEP notifications found</h3>

            <p>
                NASA DONKI returned no Solar Energetic
                Particle notifications for the selected
                seven-day query window.
            </p>

            <p class="donki-update-time">
                Retrieved: ${escapeHTML(formattedTime)}
            </p>

            <div class="nasa-science-warning">

                <p>
                    This does not mean Mars has zero radiation
                    or that the outpost is radiation-safe.
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
                ${result.fromCache ? "CACHED" : "RETRIEVED"}
            </span>

        </div>

        <h3>
            Solar particle notifications
        </h3>

        <p class="donki-introduction">

            NASA DONKI returned
            ${notifications.length} SEP notification(s)
            between ${escapeHTML(result.startDate)}
            and ${escapeHTML(result.endDate)}.

        </p>


        <div class="donki-notification-list">

            ${notifications.slice(0, 3).map(notification => `

                <article class="donki-notification">

                    <span class="donki-type">
                        ${escapeHTML(notification.type)}
                    </span>

                    <strong>
                        ${escapeHTML(notification.issueTime || "Time unavailable")}
                    </strong>

                    <p>
                        ${escapeHTML(
                            notification.message.slice(0, 260)
                        )}${notification.message.length > 260 ? "..." : ""}
                    </p>

                    ${
                        notification.url
                            ? `
                                <a
                                    href="${escapeHTML(notification.url)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View NASA notification ↗
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

            <strong>Scientific note</strong>

            <p>
                These are space-weather notifications,
                not direct radiation measurements at Mars.
                They do not calculate the ARES-6 crew's
                radiation exposure.
            </p>

        </div>


        <p class="donki-source-label">
            Source: NASA CCMC DONKI · SEP
        </p>

    `;


    return true;

}
