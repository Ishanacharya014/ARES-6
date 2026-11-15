import './style.css';

import { initializeOutpost } from './ui/outpost.js';

import { createInitialGameState } from './game/gameState.js';

import { renderEventPanel } from './ui/eventPanel.js';

import { loadEventForCurrentSol } from './game/eventManager.js';

import { applyDecision } from './game/actionManager.js';

import { updateDashboard } from './ui/dashboard.js';
import {
    completeCurrentSol
} from './simulation/simulationManager.js';
const app = document.querySelector('#app');


if (!app) {
    throw new Error('ARES-6 application container not found.');
}
// Create a fresh mission state.
const gameState = createInitialGameState();

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
                <span class="live-dot"></span>
                MARS MISSION ACTIVE
            </div>

            <div class="sol-counter">
                SOL <strong id="sol-value">01</strong> / 07
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
    aria-label="Inspect Habitat"
>
    <img src="/assets/habitat.png" alt="" />
    <span>Habitat</span>
</button>

<!-- Solar Station -->
<button
    type="button"
    class="map-facility solar-marker"
    data-facility="solarArray"
    aria-label="Inspect Solar Station"
>
    <img src="/assets/solar-array.png" alt="" />
    <span>Solar Station</span>
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
    aria-label="Inspect Storm Shelter"
>
    <img src="/assets/shelter.png" alt="" />
    <span>Storm Shelter</span>
</button>

<!-- Communication Antenna -->
<button
    type="button"
    class="map-facility antenna-marker"
    data-facility="antenna"
    aria-label="Inspect Communications"
>
    <img src="/assets/antenna.png" alt="" />
    <span>Communications</span>
</button>

<!-- Science Rover -->
<button
    type="button"
    class="map-facility rover-marker"
    data-facility="rover"
    aria-label="Inspect Science Rover"
>
    <img src="/assets/rover.png" alt="" />
    <span>Science Rover</span>
</button>


</div>


                    <div class="map-footer">
                        <span>MISSION AREA</span>
                        <span>OUTPOST VIEW</span>
                    </div>

                </section>


                <!-- RIGHT SIDEBAR -->
                <aside class="mission-sidebar">

                    <!-- CREW STATUS -->
                    <section class="side-panel">

                        <span class="eyebrow">CREW STATUS</span>

                        <h3>4 Astronauts</h3>

                        <div class="status-row">
    <span>Air system</span>
    <span class="status-good" id="air-status-value">● Good</span>
</div>

<div class="status-row">
    <span>Crew condition</span>
    <span class="status-good" id="crew-status-value">● Healthy</span>
</div>

<div class="status-row">
    <span>Radiation</span>
    <span class="status-good" id="radiation-status-value">● Safe</span>
</div>

                    </section>
                    <!-- FACILITY INFORMATION -->
                    <section
                        class="side-panel facility-panel"
                        id="facility-panel-root"
                        hidden
                        aria-live="polite"
                    >
                    </section>


                   <!-- DAILY EVENT PANEL -->
<section
    class="side-panel event-panel"
    id="event-panel-root"
    aria-live="polite"
>

    <span class="eyebrow">MISSION EVENTS</span>

    <h3>Preparing today's mission...</h3>

    <p>
        Your daily situation will appear here.
    </p>

</section>

                </aside>

            </section>

        </main>


        <!-- FOOTER -->
        <footer class="game-footer">
            ARES-6 · SEVEN SOLS TO SURVIVE
            <span>EDUCATIONAL MARS SIMULATION</span>
        </footer>

    </div>
  
`;





// =====================================
// INITIALIZE OUTPOST
// =====================================

initializeOutpost();

updateDashboard(gameState);


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
    updateDashboard(gameState);


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
            "Your crew survived seven Sols and completed both scientific research objectives. Excellent mission work!";

    } else if (status === "partial-success") {

        title = "Mission Complete!";

        description =
            "Your crew survived the seven-Sol mission, but some research objectives remain incomplete.";

    } else {

        title = "Mission Failed";

        description =
            "The crew could not safely complete the mission. Review the resource and life-support decisions.";

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
                ${completedObjectives} of 2 scientific objectives completed.
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

    `;


    // Update mission indicator.
    const missionInfo = document.querySelector(".mission-info");

    if (missionInfo) {

        missionInfo.textContent =
            status === "failure"
                ? "MISSION FAILED"
                : "MISSION COMPLETE";

    }

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
    updateDashboard(gameState);


    // Check whether the campaign has ended.
    if (gameState.mission.status !== "playing") {

        renderMissionFinished();

        return {
            success: true,
            message: "The seven-Sol mission has ended."
        };

    }


    // Load the next Sol's event.
    await initializeMissionEvent();


    return {
        success: true,
        message: "The next Sol has started."
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


    updateDashboard(gameState);


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
// START THE MISSION
// =====================================

initializeMissionEvent();
