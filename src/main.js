
import './style.css';
import { initializeOutpost } from './ui/outpost.js';
import { createInitialGameState } from './game/gameState.js';


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
                SOL <strong>01</strong> / 07
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
                        <strong>80</strong>
                        <small>Energy units</small>
                    </div>
                </div>

                <div class="resource-card water-card">
                    <div class="resource-icon">💧</div>

                    <div class="resource-info">
                        <span>WATER</span>
                        <strong>70</strong>
                        <small>Water units</small>
                    </div>
                </div>

                <div class="resource-card food-card">
                    <div class="resource-icon">🌱</div>

                    <div class="resource-info">
                        <span>FOOD</span>
                        <strong>60</strong>
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
                            <span class="status-good">● Good</span>
                        </div>

                        <div class="status-row">
                            <span>Crew condition</span>
                            <span class="status-good">● Healthy</span>
                        </div>

                        <div class="status-row">
                            <span>Radiation</span>
                            <span class="status-good">● Safe</span>
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


                    <!-- DAILY BRIEFING -->
                    <section class="side-panel briefing-panel">

                        <span class="eyebrow">DAILY BRIEFING</span>

                        <h3>Welcome to Mars!</h3>

                        <p>
                            Your crew has arrived at the ARES-6
                            outpost. Keep everyone safe and complete
                            your research mission over seven Sols.
                        </p>

                        <div class="briefing-note">
                            Your first mission is to inspect
                            the outpost systems.
                        </div>

                    </section>


                    <!-- DAILY DECISION -->
                    <section class="side-panel action-panel">

                        <span class="eyebrow">MISSION ACTION</span>

                        <h3>Daily decisions</h3>

                        <p>
                            You have one major decision available
                            this Sol.
                        </p>

                        <div class="decision-indicator">
                            <span class="status-dot"></span>
                            Decision available
                        </div>

                        <button class="end-sol-button" disabled>
                            END SOL
                        </button>

                        <small>
                            Decisions will be enabled when gameplay
                            is implemented.
                        </small>

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
// Enable outpost building interactions.
initializeOutpost();

