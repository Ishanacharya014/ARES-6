import './style.css';
import './ui/missionBriefing.css';
import { initializeMissionBriefing } from './ui/missionBriefing.js';

import { initializeOutpost } from './ui/outpost.js';

import { createInitialGameState } from './game/gameState.js';

import { renderEventPanel } from './ui/eventPanel.js';

import { loadEventForCurrentSol } from './game/eventManager.js';

import { applyDecision } from './game/actionManager.js';

import { updateDashboard } from './ui/dashboard.js';
import {
    completeCurrentSol
} from './simulation/simulationManager.js';
import { loadNASAData } from './data/nasaData.js';

import {
    renderNasaSciencePanel
} from './ui/nasaSciencePanel.js';
import {
    fetchRecentSEPNotifications
} from './data/donkiApi.js';

import {
    renderDonkiLivePanel
} from './ui/nasaSciencePanel.js';
import {
    refreshFacilityPanel
} from './ui/facilityPanel.js';
const app = document.querySelector('#app');


if (!app) {
    throw new Error('ARES-6 application container not found.');
}
// Create a fresh mission state.
let gameState = createInitialGameState();

// =====================================
// CENTRALIZED INTERFACE REFRESH
// =====================================

function refreshGameInterface() {

    // Update resources, crew and mission status.
    updateDashboard(gameState);

    // Update currently inspected facility.
    refreshFacilityPanel(gameState);

}

// Temporary verification.



app.innerHTML = `
    <div class="game-shell">

        <!-- TOP NAVIGATION -->
        <header class="topbar">

            <div class="brand">
                <div class="brand-mark">A</div>

                <div>
                    <h1>ARES-6</h1>
                    <span>JUNIOR ASTRONAUT MISSION</span>
                </div>
            </div>

            <div class="mission-info">

    <span
        class="live-dot"
        id="mission-status-dot"
        data-status="playing"
    ></span>

    <span id="mission-status-label">
        MARS MISSION ACTIVE
    </span>

</div>

            <button
                type="button"
                class="mission-guide-button"
                id="mission-guide-open"
                aria-label="Open mission guide"
            >
                ? GUIDE
            </button>

            <div class="sol-counter">
                MARS DAY <strong id="sol-value">01</strong> /
<span id="total-sols-value">07</span>
            </div>

        </header>


        <!-- MAIN GAME CONTENT -->
        <main class="game-content">

            <!-- RESOURCE DASHBOARD -->
            <section class="resource-dashboard">

                <div class="resource-card power-card">
                    <div class="resource-icon">⚡</div>

                    <div class="resource-info">
                        <span>POWER</span>
                        <strong id="power-value">80</strong>
                        <small>Energy units</small>
                    </div>
                </div>

                <div class="resource-card water-card">
                    <div class="resource-icon">💧</div>

                    <div class="resource-info">
                        <span>WATER</span>
                        <strong id="water-value">70</strong>
                        <small>Water units</small>
                    </div>
                </div>

                <div class="resource-card food-card">
                    <div class="resource-icon">🌱</div>

                    <div class="resource-info">
                        <span>FOOD</span>
                        <strong id="food-value">60</strong>
                        <small>Food units</small>
                    </div>
                </div>

            </section>


            <!-- GAME AREA -->
            <section class="game-layout">

                <!-- OUTPOST MAP -->
                <section class="outpost-section">

                    <div class="section-heading">
                        <div>
                            <span class="eyebrow">YOUR SETTLEMENT</span>
                            <h2>Mars Outpost</h2>
                        </div>

                        <span class="location-label">
                            MARS · ARES-6
                        </span>
                    </div>

                    
<div class="outpost-map" id="outpost-map">

    <!-- Mars environment -->
    <img
        class="map-terrain"
        src="/assets/mars-background.png"
        alt="Mars outpost terrain"
    />

    
<!-- Habitat -->
<button
    type="button"
    class="map-facility habitat-marker"
    data-facility="habitat"
    aria-label="Inspect Crew Home"
>
    <img src="/assets/habitat.png" alt="" />
    <span>Crew Home</span>
</button>

<!-- Solar Station -->
<button
    type="button"
    class="map-facility solar-marker"
    data-facility="solarArray"
    aria-label="Inspect Solar Panels"
>
    <img src="/assets/solar-array.png" alt="" />
    <span>Solar Panels</span>
</button>

<!-- Greenhouse -->
<button
    type="button"
    class="map-facility greenhouse-marker"
    data-facility="greenhouse"
    aria-label="Inspect Greenhouse"
>
    <img src="/assets/greenhouse.png" alt="" />
    <span>Greenhouse</span>
</button>

<!-- Storm Shelter -->
<button
    type="button"
    class="map-facility shelter-marker"
    data-facility="shelter"
    aria-label="Inspect Radiation Shelter"
>
    <img src="/assets/shelter.png" alt="" />
    <span>Radiation Shelter</span>
</button>

<!-- Communication Antenna -->
<button
    type="button"
    class="map-facility antenna-marker"
    data-facility="antenna"
    aria-label="Inspect Talk-to-Earth Antenna"
>
    <img src="/assets/antenna.png" alt="" />
    <span>Talk to Earth</span>
</button>

<!-- Science Rover -->
<button
    type="button"
    class="map-facility rover-marker"
    data-facility="rover"
    aria-label="Inspect Robot Rover"
>
    <img src="/assets/rover.png" alt="" />
    <span>Robot Rover</span>
</button>


</div>


                    <div class="map-footer">
                        <span>MISSION AREA</span>
                        <span>OUTPOST VIEW</span>
                    </div>

<!-- MISSION PROGRESS UNDER OUTPOST -->
<section class="outpost-progress">

    <!-- OBJECTIVES -->
    <div class="progress-card">

        <div class="progress-card-heading">
            <span class="eyebrow">MISSION OBJECTIVES</span>
            <strong id="completed-objectives-value">0 / 2</strong>
        </div>

        <div class="objective-item">
            <span>Study a Martian rock</span>
            <strong id="geological-objective-status">Not started</strong>
        </div>

        <div class="objective-item">
            <span>Study Mars's environment</span>
            <strong id="environmental-objective-status">Not started</strong>
        </div>

        <div class="progress-track">
            <div id="objectives-progress-fill"></div>
        </div>

    </div>


    <!-- SEVEN SOL TIMELINE -->
    <div class="progress-card">

        <div class="progress-card-heading">
            <span class="eyebrow">MISSION TIMELINE</span>
            <strong id="sol-progress-label">Mars day 1 of 7</strong>
        </div>

        <div class="sol-timeline" id="sol-timeline">

            <span data-sol-step="1" class="is-current">1</span>
            <span data-sol-step="2">2</span>
            <span data-sol-step="3">3</span>
            <span data-sol-step="4">4</span>
            <span data-sol-step="5">5</span>
            <span data-sol-step="6">6</span>
            <span data-sol-step="7">7</span>

        </div>

        <div class="timeline-labels">
            <span>MISSION START</span>
            <span>MISSION END</span>
        </div>

    </div>

</section>


                </section>


                <!-- RIGHT SIDEBAR -->
                
<!-- RIGHT SIDEBAR -->
<aside class="mission-sidebar">

    <!-- CREW STATUS -->
    <section class="side-panel crew-panel">

        <span class="eyebrow">CREW STATUS</span>

        <h3>
            <span id="crew-count-value">4</span>
            Astronauts
        </h3>

        <div class="status-row">
            <span>Air system</span>
            <span class="status-good" id="air-status-value">Good</span>
        </div>

        <div class="status-row">
            <span>Crew condition</span>
            <span class="status-good" id="crew-status-value">Healthy</span>
        </div>

        <div class="status-row">
            <span>Radiation</span>
            <span class="status-good" id="radiation-status-value">Safe</span>
        </div>

    </section>


    <!-- DAILY MISSION - PRIORITY -->
    <section
        class="side-panel event-panel"
        id="event-panel-root"
        aria-live="polite"
    >

        <span class="eyebrow">TODAY'S MISSION</span>

        <h3>Preparing today's mission...</h3>

        <p>Your daily situation will appear here.</p>

    </section>


    <!-- FACILITY INSPECTION -->
    <section
        class="side-panel facility-panel"
        id="facility-panel-root"
        hidden
        aria-live="polite"
    >
    </section>


    <!-- COLLAPSIBLE SCIENCE INFORMATION -->
    <details class="science-drawer">

        <summary>
            <span>
                <strong>NASA SCIENCE & SPACE WEATHER</strong>
                <small>Historical research and live updates</small>
            </span>

            <span class="science-chevron">+</span>
        </summary>


        <section
            class="side-panel nasa-science-panel"
            id="nasa-science-panel-root"
            aria-live="polite"
        >
            <span class="eyebrow">NASA HISTORICAL DATA</span>
            <h3>Loading historical research...</h3>
        </section>


        <section
            class="side-panel donki-live-panel"
            id="donki-live-panel-root"
            aria-live="polite"
        >
            <span class="eyebrow">SPACE WEATHER UPDATE</span>
            <h3>Checking NASA DONKI...</h3>
        </section>

    </details>

</aside>


            </section>

        </main>


        <!-- FOOTER -->
        <footer class="game-footer">
            ARES-6 · SEVEN MARS DAYS TO SURVIVE
            <span>EDUCATIONAL MARS SIMULATION</span>
        </footer>

    </div>

    <!-- FIRST-TIME MISSION BRIEFING -->
    <div
        class="mission-briefing-overlay"
        id="mission-briefing"
        hidden
    >
        <section
            class="mission-briefing-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-briefing-title"
            aria-describedby="mission-briefing-description"
        >
            <div class="mission-briefing-topline">
                <div class="mission-briefing-brand">
                    <span class="mission-briefing-brand-mark">A</span>
                    <span>ARES-6 MISSION CONTROL</span>
                </div>
                <span class="mission-briefing-tag">FIRST MISSION BRIEFING</span>
            </div>

            <h2 class="mission-briefing-heading" id="mission-briefing-title">
                Welcome to Mars, Commander.
            </h2>

            <p class="mission-briefing-intro" id="mission-briefing-description">
                Your crew is ready. Guide four astronauts through seven days on Mars.
                Keep enough power, water, and food for everyone, and finish both science goals.
            </p>

            <div class="mission-briefing-stats" aria-label="Mission overview">
                <div class="mission-briefing-stat">
                    <strong>4</strong>
                    <span>Astronauts</span>
                </div>
                <div class="mission-briefing-stat">
                    <strong>7</strong>
                    <span>Mars days</span>
                </div>
                <div class="mission-briefing-stat">
                    <strong>2</strong>
                    <span>Science goals</span>
                </div>
            </div>

            <p class="mission-briefing-intro">
                Scientists call one day on Mars a Sol. To make the game easier to follow, we call it a Mars day.
            </p>

            <div class="mission-briefing-grid">
                <article class="mission-briefing-card">
                    <span class="mission-briefing-card-icon" aria-hidden="true">⚡</span>
                    <div>
                        <h3>Watch your supplies</h3>
                        <p>
                            Power, water, and food help the crew live and keep the outpost running.
                            The crew uses some supplies every Mars day, so spend them carefully.
                        </p>
                    </div>
                </article>

                <article class="mission-briefing-card">
                    <span class="mission-briefing-card-icon" aria-hidden="true">☑</span>
                    <div>
                        <h3>Choose once each Mars day</h3>
                        <p>
                            Read the mission event and choose A or B. You can make one big choice
                            each Mars day. Press End Mars Day after choosing to move to the next day.
                        </p>
                    </div>
                </article>

                <article class="mission-briefing-card">
                    <span class="mission-briefing-card-icon" aria-hidden="true">⌖</span>
                    <div>
                        <h3>Explore the outpost</h3>
                        <p>
                            Click the Crew Home, Solar Panels, Greenhouse, Radiation Shelter,
                            Talk to Earth antenna, or Robot Rover on the map
                            to learn what each place does.
                        </p>
                    </div>
                </article>

                <article class="mission-briefing-card">
                    <span class="mission-briefing-card-icon" aria-hidden="true">◎</span>
                    <div>
                        <h3>Finish both science goals</h3>
                        <p>
                            Study a Martian rock and learn about the area around your outpost.
                            Finish both goals before the end of Mars day 7.
                            Track your progress below the map.
                        </p>
                    </div>
                </article>

                <article class="mission-briefing-card mission-briefing-card-wide">
                    <span class="mission-briefing-card-icon" aria-hidden="true">🔬</span>
                    <div>
                        <h3>Explore real Mars science</h3>
                        <p>
                            Open the NASA Science &amp; Space Weather panel to see what NASA's
                            Curiosity rover measured on Mars and to check space-weather
                            updates. NASA measurements are real; the game's resource
                            and radiation points are made for this simulation.
                        </p>
                    </div>
                </article>
            </div>

            <p class="mission-briefing-note">
                Mission tip: you cannot undo a choice. Read both options, check your supplies,
                and do your best to keep the crew safe.
            </p>

            <div class="mission-briefing-actions">
                <button
                    type="button"
                    class="mission-briefing-skip"
                    id="mission-briefing-skip"
                >
                    Skip briefing
                </button>
                <button
                    type="button"
                    class="mission-briefing-start"
                    id="mission-briefing-start"
                >
                    Launch mission
                </button>
            </div>
        </section>
    </div>
  
`;





// =====================================
// INITIALIZE OUTPOST
// =====================================

initializeOutpost(gameState);

refreshGameInterface();
initializeMissionBriefing();



// =====================================
// HANDLE PLAYER DECISION
// =====================================

function handleChoiceSelected(choice) {

    // Apply the selected decision.
    const result = applyDecision(gameState, choice);


    if (!result.success) {
        return result;
    }


    // Update resources and crew status.
    refreshGameInterface();;


    return {

        success: true,

        message:
            choice.explanation ||
            result.message

    };

}


// =====================================
// DISPLAY FINAL MISSION RESULT
// =====================================

function renderMissionFinished() {

    const panel = document.querySelector("#event-panel-root");

    const status = gameState.mission.status;


    let title;
    let description;


    if (status === "success") {

        title = "Mission Successful!";

        description =
            "Your crew made it through all seven days on Mars and finished both science goals. Excellent work!";

    } else if (status === "partial-success") {

        title = "Mission Finished";

        description =
            "Your crew made it through all seven days, but one or both science goals are not finished.";

    } else {

        title = "Mission Failed";

        description =
            "The crew could not safely finish the mission. Check the supplies and make sure the habitat air system is working.";

    }


    const completedObjectives =
        Object.values(gameState.objectives)
            .filter(Boolean).length;


    panel.innerHTML = `

        <span class="eyebrow">MISSION REPORT</span>

        <h3 class="event-title">${title}</h3>

        <p class="event-description">
            ${description}
        </p>

        <div class="event-science-fact">

            <span>RESEARCH PROGRESS</span>

            <p>
                ${completedObjectives} of 2 science goals completed.
            </p>

        </div>

        <div class="event-science-fact">

            <span>FINAL RESOURCES</span>

            <p>
                Power: ${gameState.resources.power}<br>
                Water: ${gameState.resources.water}<br>
                Food: ${gameState.resources.food}
            </p>

        </div>

        <p class="event-description">
            Thank you for completing ARES-6.
        </p>

        <div class="mission-report-actions">
            <button
                type="button"
                class="restart-mission-button"
                id="restart-mission-button"
            >
                ↻ Restart Mission
            </button>
        </div>

        <small class="restart-mission-help">
            Start again from Mars day 1 with full supplies.
        </small>

    `;

    const restartButton = panel.querySelector("#restart-mission-button");
    restartButton?.addEventListener("click", restartMission);

}


// =====================================
// RESTART THE SEVEN-SOL MISSION
// =====================================

async function restartMission() {

    // Ask before discarding the completed campaign.
    const confirmed = window.confirm(
        "Restart ARES-6? Your current mission progress and resources will be reset."
    );

    if (!confirmed) {
        return;
    }

    // Create a completely fresh mission state.
    gameState = createInitialGameState();

    // Close any facility inspection left open from the previous mission.
    const facilityPanel = document.querySelector("#facility-panel-root");

    if (facilityPanel) {
        facilityPanel.hidden = true;
        facilityPanel.innerHTML = "";
    }

    // Collapse the optional science drawer for the new run.
    document.querySelector(".science-drawer")?.removeAttribute("open");

    // Reset resources, crew, facilities, objectives and mission progress.
    refreshGameInterface();

    // Load the first Sol event and restore its decision controls.
    await initializeMissionEvent();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    console.log("ARES-6 mission restarted with a fresh game state.");
}



// =====================================
// COMPLETE CURRENT SOL
// =====================================

async function handleEndSol() {

    // Run all simulation systems.
    const result = completeCurrentSol(gameState);


    if (!result.success) {

        return result;

    }


    console.log(
        `SOL COMPLETED. Current Sol: ${gameState.mission.currentSol}`,
        result.results
    );


    // Update the dashboard.
    refreshGameInterface();;


    // Check whether the campaign has ended.
    if (gameState.mission.status !== "playing") {

        renderMissionFinished();

        return {
            success: true,
            message: "The seven-day Mars mission has ended."
        };

    }


    // Load the next Sol's event.
    await initializeMissionEvent();


    return {
        success: true,
        message: "The next Mars day has started."
    };

}


// =====================================
// LOAD AND DISPLAY CURRENT EVENT
// =====================================

async function initializeMissionEvent() {

    const panel = document.querySelector("#event-panel-root");


    if (!panel) {

        console.error("Mission event panel not found.");

        return;

    }


    panel.innerHTML = `
        <span class="eyebrow">MISSION EVENTS</span>
        <h3>Loading today's event...</h3>
    `;


    const result = await loadEventForCurrentSol(gameState);


    if (!result.success) {

        panel.innerHTML = `
            <span class="eyebrow">EVENT ERROR</span>
            <h3>Unable to load today's event.</h3>
            <p>${result.message}</p>
        `;

        console.error(result.message);

        return;

    }


    refreshGameInterface();;


    // Render actual event with both callbacks.
    renderEventPanel(

        result.event,

        handleChoiceSelected,

        handleEndSol

    );


    console.log(
        "Current event loaded:",
        result.event.title
    );

}


// =====================================
// INITIALIZE NASA SCIENCE PANEL
// =====================================

async function initializeNasaSciencePanel() {

    console.log("Loading NASA science information...");


    // Load validated historical NASA data.
    const result = await loadNASAData();


    // Render the information.
    const rendered = renderNasaSciencePanel(result);


    if (!rendered) {

        console.warn(
            "NASA Science Panel could not display its data."
        );

        return;

    }


    console.log(
        "NASA historical radiation data displayed successfully."
    );

}

// =====================================
// INITIALIZE DONKI SPACE WEATHER PANEL
// =====================================

async function initializeDonkiPanel() {

    console.log("Requesting NASA DONKI information...");


    const result = await fetchRecentSEPNotifications({
        days: 7
    });


    // Render the result or the fallback message.
    renderDonkiLivePanel(result);


    if (result.success) {

        console.log(
            "DONKI retrieval successful:",
            result
        );

        console.log(
            "SEP notification count:",
            result.notifications.length
        );

    } else {

        console.warn(
            "DONKI unavailable. Historical data remains active.",
            result.message
        );

    }

}

// =====================================
// START THE MISSION
// =====================================






// =====================================
// ARES-6 APPLICATION STARTUP
// =====================================

async function startApplication() {

    console.log("===== ARES-6 INITIALIZATION =====");


    // Load independent mission panels together.
    const results = await Promise.allSettled([

        initializeMissionEvent(),

        initializeNasaSciencePanel(),

        initializeDonkiPanel()

    ]);


    // Report initialization failures.
    results.forEach((result, index) => {

        const names = [
            "Mission Event",
            "NASA Science",
            "NASA DONKI"
        ];


        if (result.status === "rejected") {

            console.error(
                `${names[index]} initialization failed:`,
                result.reason
            );

        }

    });


    console.log("===== ARES-6 INITIALIZATION FINISHED =====");

}


// Start the application panels.
startApplication();
