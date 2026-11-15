
import './style.css';

// Find the main application container.
const app = document.querySelector('#app');

// Stop if the container does not exist.
if (!app) {
    throw new Error('ARES-6 application container not found.');
}

// Display the initial application screen.
app.innerHTML = `
    <div class="page-shell">

        <header class="topbar">

            <div class="brand">
                <div class="brand-mark">A</div>

                <div>
                    <strong>ARES-6</strong>
                    <span>JUNIOR ASTRONAUT MISSION TRAINER</span>
                </div>
            </div>

            <div class="build-label">
                DEVELOPMENT BUILD
            </div>

        </header>

        <main class="intro-card">

            <p class="eyebrow">
                MISSION SYSTEM INITIALIZATION
            </p>

            <h1>ARES-6</h1>

            <h2>Seven Sols to Survive</h2>

            <div class="separator"></div>

            <h3>Project environment ready.</h3>

            <p class="description">
                Your Mars mission is being prepared.

                The outpost, crew, resources and mission
                systems will be developed in the upcoming stages.
            </p>

            <div class="status-list">

                <div class="status-item">
                    <span class="status-dot"></span>
                    Project initialized
                </div>

                <div class="status-item">
                    <span class="status-dot"></span>
                    JavaScript environment ready
                </div>

                <div class="status-item">
                    <span class="status-dot"></span>
                    Game architecture prepared
                </div>

            </div>

        </main>

        <footer>
            ARES-6 DEVELOPMENT PROJECT · MARS MISSION
        </footer>

    </div>
`;
