import './style.css';
import './ui/missionBriefing.css';
import { initializeMissionBriefing } from './ui/missionBriefing.js';
import { refreshMapEffects } from './ui/mapEffects.js';
import { renderPowerPlanner } from './ui/powerPlanner.js';
import { saveDailyPowerAllocation } from './game/powerAllocation.js';
import { showDailyDebrief } from './ui/dailyDebrief.js';
import { saveAutosave, readAutosave, clearAutosave } from './game/autosave.js';
import { showSavePrompt } from './ui/savePrompt.js';

import { initializeOutpost } from './ui/outpost.js';

import { GAME_CONFIG, createInitialGameState } from './game/gameState.js';

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
// LOCAL AUTOSAVE HELPERS
// =====================================

function updateAutosaveStatus(message, status = "saved") {

    const indicator = document.querySelector("#autosave-status");

    if (!indicator) return;

    indicator.textContent = message;
    indicator.dataset.status = status;

}

function persistCurrentMission() {

    const result = saveAutosave(gameState);

    if (result.success) {
        const time = new Date(result.savedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        updateAutosaveStatus("AUTOSAVED · " + time, "saved");

    } else {

        updateAutosaveStatus("SAVE UNAVAILABLE", "error");

    }

    return result;

}

function replaceCurrentGameState(nextState) {

    // Preserve the original outer object so existing outpost event
    // listeners continue to reference the active game state.
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }

    Object.assign(gameState, nextState);

}


// =====================================
// CENTRALIZED INTERFACE REFRESH
// =====================================

function refreshGameInterface() {

    // Update resources, crew and mission status.
    updateDashboard(gameState);

    // Update currently inspected facility.
    refreshFacilityPanel(gameState);

    // Show dust, radiation, crop and equipment conditions on the Mars map.
    refreshMapEffects(gameState);

    // Keep the active campaign mode visible in the top navigation.
    updateMissionScenarioUI();

    // Render the optional daily power planner.
    renderPowerPlanner(
        gameState,
        allocation => {
            const result = saveDailyPowerAllocation(gameState, allocation);

            if (result.success) {
                persistCurrentMission();
            }

            return result;
        }
    );

    updatePowerPlanningUI();

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

            <span class="autosave-status" id="autosave-status" role="status">
                SAVE READY
            </span>

            <button
                type="button"
                class="mission-guide-button"
                id="mission-guide-open"
                aria-label="Open mission guide"
            >
                ? GUIDE
            </button>

            <button
                type="button"
                class="mission-scenario-button"
                id="mission-scenario-button"
                aria-label="Switch to the May 2024 historical solar storm scenario"
                title="Start the optional May 2024 historical solar storm scenario"
            >
                MAY 2024 STORM
            </button>

            <button
                type="button"
                class="power-planning-toggle"
                id="power-planning-toggle"
                aria-pressed="false"
                title="Optional advanced power planning"
            >
                POWER PLAN: OFF
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
            <strong id="completed-objectives-value">0 / 4</strong>
        </div>

        <div class="objective-item">
            <span>Study a Martian rock</span>
            <strong id="geological-objective-status">Not started</strong>
        </div>

        <div class="objective-item">
            <span>Study Mars's environment</span>
            <strong id="environmental-objective-status">Not started</strong>
        </div>

        <div class="objective-item">
            <span>Survey possible water ice</span>
            <strong id="water-ice-objective-status">Not started</strong>
        </div>

        <div class="objective-item">
            <span>Study Mars's atmosphere</span>
            <strong id="atmospheric-objective-status">Not started</strong>
        </div>

        <div class="progress-track">
            <div id="objectives-progress-fill"></div>
        </div>

    </div>


    <!-- FOURTEEN MARS DAY TIMELINE -->
    <div class="progress-card">

        <div class="progress-card-heading">
            <span class="eyebrow">MISSION TIMELINE</span>
            <strong id="sol-progress-label">Mars day 1 of 14</strong>
        </div>

        <div class="sol-timeline" id="sol-timeline" aria-label="14-day mission timeline">

            ${Array.from({ length: GAME_CONFIG.totalSols }, (_, index) => {
                const day = index + 1;
                return `<span data-sol-step="${day}"${day === 1 ? ' class="is-current"' : ''}>${day}</span>`;
            }).join("")}

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
        <div class="status-row">
            <span>Water recovery</span>
            <span class="status-good" id="water-recycler-status-value">Working</span>
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


    <!-- OPTIONAL ADVANCED POWER PLANNING -->
    <section
        class="side-panel power-planner-panel"
        id="power-planner-panel"
        hidden
        aria-live="polite"
    ></section>


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
            ARES-6 · FOURTEEN MARS DAYS TO COMPLETE
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
                Your crew is ready. Guide four astronauts through 14 days on Mars.
                Keep enough power, water, and food for everyone, complete four science goals, and send your final report to Earth.
            </p>

            <div class="mission-briefing-stats" aria-label="Mission overview">
                <div class="mission-briefing-stat">
                    <strong>4</strong>
                    <span>Astronauts</span>
                </div>
                <div class="mission-briefing-stat">
                    <strong>14</strong>
                    <span>Mars days</span>
                </div>
                <div class="mission-briefing-stat">
                    <strong>4</strong>
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
                            The water recycler can recover 2 water units each day while it is working. Repair it if it breaks, or use the emergency reserve.
                            For an extra challenge, turn on Power Plan in the top bar to share extra power between outpost systems.
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
                        <h3>Finish all four science goals</h3>
                        <p>
                            Study a Martian rock, map possible water ice, learn about the environment, and study the atmosphere.
                            Complete all four goals and send your final report by Mars day 14.
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

    <!-- DAILY MISSION DEBRIEF -->
    <div
        class="daily-debrief-overlay"
        id="daily-debrief-screen"
        hidden
    >
        <main
            class="daily-debrief-page"
            id="daily-debrief-page"
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-debrief-title"
            aria-describedby="daily-debrief-description"
        >
            <div class="daily-debrief-brand">
                <span class="daily-debrief-brand-mark">A</span>
                <div>
                    <strong>ARES-6 MISSION CONTROL</strong>
                    <small>DAILY OUTPOST REPORT</small>
                </div>
            </div>

            <div id="daily-debrief-content"></div>

            <button
                type="button"
                class="daily-debrief-continue"
                id="daily-debrief-continue"
            >
                CONTINUE
            </button>
        </main>
    </div>

    <!-- FULL-SCREEN MISSION ENDING -->
    <div class="mission-ending-overlay" id="mission-ending-screen" hidden>
        <div class="mission-ending-effects" aria-hidden="true">
            <span class="mission-ending-particle particle-1">✦</span>
            <span class="mission-ending-particle particle-2">◆</span>
            <span class="mission-ending-particle particle-3">✧</span>
            <span class="mission-ending-particle particle-4">●</span>
            <span class="mission-ending-particle particle-5">✦</span>
            <span class="mission-ending-particle particle-6">◆</span>
            <span class="mission-ending-particle particle-7">✧</span>
            <span class="mission-ending-particle particle-8">●</span>
            <span class="mission-ending-particle particle-9">✦</span>
            <span class="mission-ending-particle particle-10">◆</span>
            <span class="mission-ending-particle particle-11">✧</span>
            <span class="mission-ending-particle particle-12">●</span>
        </div>
        <main
            class="mission-ending-page"
            id="mission-ending-page"
            data-outcome="success"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ending-title"
            aria-describedby="ending-description"
        >
            <div class="mission-ending-brand">
                <span class="mission-ending-brand-mark">A</span>
                <div>
                    <strong>ARES-6</strong>
                    <small>JUNIOR ASTRONAUT MISSION</small>
                </div>
            </div>

            <section class="mission-ending-hero">
                <div class="mission-ending-mark" id="ending-mark" aria-hidden="true">✓</div>
                <span class="mission-ending-kicker" id="ending-kicker">MISSION COMPLETE</span>
                <h1 id="ending-title">Mission Accomplished!</h1>
                <p id="ending-description"></p>
            </section>

            <section class="mission-ending-stats" aria-label="Mission results">
                <article class="mission-ending-stat">
                    <span>MARS DAYS</span>
                    <strong id="ending-days">1 / 14</strong>
                    <small>Days completed</small>
                </article>
                <article class="mission-ending-stat">
                    <span>CREW STATUS</span>
                    <strong id="ending-crew-status">Healthy</strong>
                    <small id="ending-crew-count">4 astronauts</small>
                </article>
                <article class="mission-ending-stat">
                    <span>SCIENCE GOALS</span>
                    <strong id="ending-objective-count">0 / 4</strong>
                    <small>Goals completed</small>
                </article>
            </section>

            <section class="mission-ending-details">
                <article class="mission-ending-detail-card">
                    <h2>Science goals</h2>
                    <div class="mission-ending-goal-row">
                        <span>Study a Martian rock</span>
                        <strong id="ending-geological-status">Completed</strong>
                    </div>
                    <div class="mission-ending-goal-row">
                        <span>Study Mars's environment</span>
                        <strong id="ending-environmental-status">Completed</strong>
                    </div>
                    <div class="mission-ending-goal-row">
                        <span>Survey possible water ice</span>
                        <strong id="ending-water-ice-status">Not completed</strong>
                    </div>
                    <div class="mission-ending-goal-row">
                        <span>Study Mars's atmosphere</span>
                        <strong id="ending-atmospheric-status">Not completed</strong>
                    </div>
                    <div class="mission-ending-goal-row mission-ending-report-row">
                        <span>Final report sent to Earth</span>
                        <strong id="ending-report-status">Not sent</strong>
                    </div>
                    <div class="mission-ending-goal-row mission-ending-insight-row">
                        <span>Bonus science insights</span>
                        <strong id="ending-science-insights">0</strong>
                    </div>
                </article>

                <article class="mission-ending-detail-card">
                    <h2>Supplies remaining</h2>
                    <div class="mission-ending-resource-row">
                        <span>⚡ Power</span>
                        <strong id="ending-power">0 units</strong>
                    </div>
                    <div class="mission-ending-resource-row">
                        <span>💧 Water</span>
                        <strong id="ending-water">0 units</strong>
                    </div>
                    <div class="mission-ending-resource-row">
                        <span>🌱 Food</span>
                        <strong id="ending-food">0 units</strong>
                    </div>
                </article>
            </section>

            <div class="mission-ending-footer">
                <p id="ending-footer-note">Your final mission report is ready.</p>
                <button
                    type="button"
                    class="mission-ending-restart"
                    id="ending-restart-button"
                >
                    ↻ RESTART MISSION
                </button>
            </div>

            <small class="mission-ending-footnote">
                ARES-6 · EDUCATIONAL MARS SIMULATION
            </small>
        </main>
    </div>

  
`;





// =====================================
// INITIALIZE OUTPOST
// =====================================

initializeOutpost(gameState);

refreshGameInterface();

document.querySelector("#mission-scenario-button")?.addEventListener(
    "click",
    switchMissionScenario
);

document.querySelector("#power-planning-toggle")?.addEventListener(
    "click",
    togglePowerPlanning
);

updateMissionScenarioUI();
updatePowerPlanningUI();



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
    refreshGameInterface();

    // Preserve the choice if the browser closes before this Mars day ends.
    persistCurrentMission();


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


function setEndingText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = String(value);
    }
}


// =====================================
// DISPLAY THE FULL-SCREEN MISSION ENDING
// =====================================

function renderMissionFinished() {

    const screen = document.querySelector("#mission-ending-screen");
    const page = document.querySelector("#mission-ending-page");

    if (!screen || !page) {
        console.error("Mission ending screen was not found.");
        return false;
    }

    const outcomes = {
        success: {
            kicker: "MISSION ACCOMPLISHED",
            title: "You did it, Commander!",
            description:
                "Your crew made it through all 14 days on Mars, completed all four science goals, and sent the final report to Earth. The mission was a success!",
            mark: "✓",
            footer:
                "Mission Control has received your final report. Ready for another mission?",
            outcome: "success"
        },
        "partial-success": {
            kicker: "MISSION COMPLETE",
            title: "Your crew made it!",
            description:
                "Your crew completed all 14 days on Mars, but some science goals or the final report are unfinished. There is more to discover on your next mission.",
            mark: "★",
            footer:
                "You kept the mission going. Try again to complete all four science goals and send the final report.",
            outcome: "partial-success"
        },
        failure: {
            kicker: "MISSION ENDED",
            title: "This mission needs a new plan.",
            description:
                "The crew could no longer continue safely. Review the air system and crew supplies, then try again with a new plan.",
            mark: "!",
            footer:
                "Every mission teaches us something. Make a new plan and give it another try.",
            outcome: "failure"
        }
    };

    const result = outcomes[gameState.mission.status] ?? outcomes.failure;

    const objectiveEntries = Object.entries(gameState.objectives);
    const completedObjectives = objectiveEntries.filter(([, complete]) => complete).length;
    const totalObjectives = objectiveEntries.length;
    const geologicalComplete = Boolean(gameState.objectives.geologicalResearch);
    const environmentalComplete = Boolean(gameState.objectives.environmentalResearch);
    const waterIceComplete = Boolean(gameState.objectives.waterIceResearch);
    const atmosphericComplete = Boolean(gameState.objectives.atmosphericResearch);

    const crewLabels = {
        healthy: "Healthy",
        "needs-attention": "Needs attention",
        critical: "Critical"
    };

    page.dataset.outcome = result.outcome;
    screen.dataset.outcome = result.outcome;

    setEndingText("ending-kicker", result.kicker);
    setEndingText("ending-title", result.title);
    setEndingText("ending-description", result.description);
    setEndingText("ending-mark", result.mark);
    setEndingText("ending-footer-note", result.footer);

    setEndingText(
        "ending-days",
        gameState.mission.currentSol + " / " + gameState.mission.totalSols
    );

    setEndingText(
        "ending-crew-status",
        crewLabels[gameState.crew.condition] ?? "Unknown"
    );

    setEndingText("ending-crew-count", gameState.crew.count + " astronauts");
    setEndingText("ending-objective-count", completedObjectives + " / " + totalObjectives);
    setEndingText(
        "ending-geological-status",
        geologicalComplete ? "Completed" : "Not completed"
    );
    setEndingText(
        "ending-environmental-status",
        environmentalComplete ? "Completed" : "Not completed"
    );
    setEndingText(
        "ending-water-ice-status",
        waterIceComplete ? "Completed" : "Not completed"
    );
    setEndingText(
        "ending-atmospheric-status",
        atmosphericComplete ? "Completed" : "Not completed"
    );
    setEndingText(
        "ending-report-status",
        gameState.mission.finalReportTransmitted ? "Sent to Earth" : "Not sent"
    );
    setEndingText(
        "ending-science-insights",
        gameState.systems.scienceInsightPoints ?? 0
    );

    setEndingText("ending-power", gameState.resources.power + " units");
    setEndingText("ending-water", gameState.resources.water + " units");
    setEndingText("ending-food", gameState.resources.food + " units");

    screen.hidden = false;
    document.body.classList.add("mission-ending-open");

    const restartButton = screen.querySelector("#ending-restart-button");
    // Replace the handler on each replay so clicks never stack listeners.
    if (restartButton) {
        restartButton.onclick = restartMission;
    }
    restartButton?.focus();

    return true;
}


// =====================================
// RESTART THE FOURTEEN-DAY MISSION
// =====================================

async function restartMission() {

    // Ask before discarding the completed campaign.
    const confirmed = window.confirm(
        "Restart ARES-6? Your current mission progress and resources will be reset."
    );

    if (!confirmed) {
        return;
    }

    // Close the ending screen before starting the new mission.
    const endingScreen = document.querySelector("#mission-ending-screen");
    if (endingScreen) {
        endingScreen.hidden = true;
    }
    document.body.classList.remove("mission-ending-open");

    // Preserve the selected campaign and planning mode when replaying.
    const selectedScenarioId = gameState.mission.scenarioId ?? "standard";
    const powerPlanningEnabled = gameState.mission.powerPlanningEnabled === true;

    // Create a completely fresh mission state.
    replaceCurrentGameState(
        createInitialGameState(selectedScenarioId, { powerPlanningEnabled })
    );
    persistCurrentMission();

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
// UPDATE ADVANCED POWER PLANNING BUTTON
// =====================================

function updatePowerPlanningUI() {

    const button = document.querySelector("#power-planning-toggle");

    if (!button) {
        return;
    }

    const enabled = gameState.mission.powerPlanningEnabled === true;

    button.textContent = enabled
        ? "POWER PLAN: ON"
        : "POWER PLAN: OFF";

    button.setAttribute("aria-pressed", String(enabled));

    button.setAttribute(
        "aria-label",
        enabled
            ? "Turn off advanced power planning"
            : "Turn on advanced power planning"
    );

}


// =====================================
// TOGGLE OPTIONAL POWER PLANNING
// =====================================

function togglePowerPlanning() {

    if (gameState.mission.status !== "playing") {
        return;
    }

    const enabling =
        gameState.mission.powerPlanningEnabled !== true;

    const message = enabling
        ? "Turn on advanced power planning? You will need to save a power plan before ending each Mars day. The usual A/B mission choices stay the same."
        : "Turn off advanced power planning? Today's saved power plan will be cleared.";

    if (!window.confirm(message)) {
        return;
    }

    gameState.mission.powerPlanningEnabled = enabling;

    gameState.turn.powerAllocation = {
        greenhouse: 0,
        rover: 0,
        shelter: 0,
        total: 0,
        confirmed: false
    };

    refreshGameInterface();
    persistCurrentMission();

}


// =====================================
// UPDATE THE ACTIVE SCENARIO LABEL
// =====================================

function updateMissionScenarioUI() {

    const button = document.querySelector("#mission-scenario-button");
    const statusLabel = document.querySelector("#mission-status-label");
    const statusDot = document.querySelector("#mission-status-dot");

    const historicalActive =
        gameState.mission.scenarioId === "may-2024-solar-storm";

    if (button) {
        button.textContent = historicalActive
            ? "STANDARD CAMPAIGN"
            : "MAY 2024 STORM";

        button.setAttribute(
            "aria-label",
            historicalActive
                ? "Switch to the standard ARES-6 campaign"
                : "Switch to the May 2024 historical solar storm scenario"
        );

        button.title = historicalActive
            ? "Return to the standard 14-day campaign"
            : "Play a training scenario based on NASA's May 20, 2024 Mars solar storm";
    }

    if (statusLabel) {
        statusLabel.textContent = historicalActive
            ? "MAY 2024 STORM SCENARIO"
            : "MARS MISSION ACTIVE";
    }

    if (statusDot) {
        statusDot.dataset.status = historicalActive
            ? "historical"
            : "playing";
    }

}


// =====================================
// SWITCH BETWEEN CAMPAIGN SCENARIOS
// =====================================

async function switchMissionScenario() {

    const currentScenarioId = gameState.mission.scenarioId ?? "standard";

    const nextScenarioId =
        currentScenarioId === "may-2024-solar-storm"
            ? "standard"
            : "may-2024-solar-storm";

    const nextScenarioName =
        nextScenarioId === "may-2024-solar-storm"
            ? "the May 2024 Solar Storm Scenario"
            : "the standard ARES-6 campaign";

    const confirmed = window.confirm(
        "Start " + nextScenarioName + "? Your current campaign progress will be reset."
    );

    if (!confirmed) {
        return;
    }

    const endingScreen = document.querySelector("#mission-ending-screen");
    if (endingScreen) {
        endingScreen.hidden = true;
    }

    document.body.classList.remove("mission-ending-open");

    const powerPlanningEnabled = gameState.mission.powerPlanningEnabled === true;
    replaceCurrentGameState(
        createInitialGameState(nextScenarioId, { powerPlanningEnabled })
    );
    persistCurrentMission();

    const facilityPanel = document.querySelector("#facility-panel-root");
    if (facilityPanel) {
        facilityPanel.hidden = true;
        facilityPanel.innerHTML = "";
    }

    document.querySelector(".science-drawer")?.removeAttribute("open");

    refreshGameInterface();
    await initializeMissionEvent();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    console.log("ARES-6 scenario selected:", nextScenarioId);
}


// =====================================
// COMPLETE CURRENT SOL
// =====================================

async function handleEndSol() {

    // Keep a copy of the state after the player's choice but before
    // automatic end-of-day systems run.
    const completedSol = gameState.mission.currentSol;
    const beforeState = structuredClone(gameState);

    const decision = [...gameState.history]
        .reverse()
        .find(entry => entry.sol === completedSol) ?? null;

    // Run solar generation, life support, crew supplies, crops,
    // radiation and the optional power plan.
    const result = completeCurrentSol(gameState);

    if (!result.success) {
        return result;
    }

    console.log(
        `MARS DAY ${completedSol} COMPLETED`,
        result.results
    );

    // Save only after the complete simulation has committed.
    persistCurrentMission();

    refreshGameInterface();

    // Save the state after all automatic systems and mission checks.
    const afterState = structuredClone(gameState);

    // Explain the player's decision and the actual daily simulation results.
    await showDailyDebrief({
        completedSol,
        beforeState,
        afterState,
        simulationResults: result.results,
        decision
    });

    // The debrief appears before the final result screen.
    if (gameState.mission.status !== "playing") {

        renderMissionFinished();

        return {
            success: true,
            message: "The Mars mission has ended."
        };

    }

    // Continue to the next Mars day's event only after the player
    // has read and closed the debrief.
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

        handleEndSol,

        gameState.mission.scenarioId ?? "standard",

        {
            ...gameState.turn,
            powerPlanningEnabled: gameState.mission.powerPlanningEnabled
        }

    );


    // Save event starting conditions and the current event identifier.
    persistCurrentMission();

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

    updateAutosaveStatus("CHECKING SAVE", "idle");

    // Check for a previous mission before loading the event panel.
    const savedMission = readAutosave();

    if (savedMission.status === "valid" || savedMission.status === "invalid") {

        const startupChoice = await showSavePrompt(savedMission);

        if (
            startupChoice === "continue" &&
            savedMission.status === "valid"
        ) {

            replaceCurrentGameState(savedMission.gameState);

            updateAutosaveStatus("SAVE RESTORED", "saved");

            console.log(
                "ARES-6 mission restored:",
                gameState.mission.scenarioId,
                "Mars day",
                gameState.mission.currentSol
            );

        } else {

            clearAutosave();
            replaceCurrentGameState(createInitialGameState());

            updateAutosaveStatus("NEW MISSION", "idle");

        }

    } else if (savedMission.status === "unavailable") {

        updateAutosaveStatus("SAVE UNAVAILABLE", "error");

    } else {

        updateAutosaveStatus("NEW MISSION", "idle");

    }

    // Rebuild the visible interface from the restored or fresh state.
    refreshGameInterface();

    // Show the first-time briefing only after the save decision.
    initializeMissionBriefing();

    const initializationTasks = [
        initializeNasaSciencePanel(),
        initializeDonkiPanel()
    ];

    if (gameState.mission.status === "playing") {

        initializationTasks.unshift(initializeMissionEvent());

    } else {

        // A saved completed/failed campaign opens directly to its result.
        renderMissionFinished();

    }

    const results = await Promise.allSettled(initializationTasks);

    results.forEach((result, index) => {

        if (result.status === "rejected") {
            console.error(
                `ARES-6 initialization task ${index + 1} failed:`,
                result.reason
            );
        }

    });

    // The event loader also saves after its starting conditions are applied.
    if (gameState.mission.status === "playing") {
        persistCurrentMission();
    }

    console.log("===== ARES-6 INITIALIZATION FINISHED =====");

}


// Start the application panels.
startApplication();
