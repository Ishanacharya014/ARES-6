import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../src/game/gameState.js";
import {
    AUTOSAVE_KEY,
    AUTOSAVE_VERSION,
    clearAutosave,
    readAutosave,
    saveAutosave,
    validateSavedGameState
} from "../src/game/autosave.js";

let values;

function createStorage(overrides = {}) {
    values = new Map();

    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },

        setItem(key, value) {
            if (overrides.setItem) {
                return overrides.setItem(key, value);
            }

            values.set(key, String(value));
        },

        removeItem(key) {
            if (overrides.removeItem) {
                return overrides.removeItem(key);
            }

            values.delete(key);
        }
    };
}

beforeEach(() => {
    globalThis.window = {
        localStorage: createStorage()
    };
});

afterEach(() => {
    delete globalThis.window;
});

test("a fresh standard campaign is a valid save", () => {
    const state = createInitialGameState();

    assert.equal(validateSavedGameState(state), true);
});

test("autosave writes and restores the complete mission state", () => {
    const state = createInitialGameState("may-2024-solar-storm", {
        powerPlanningEnabled: true
    });

    state.mission.currentSol = 8;
    state.turn.currentEventId = "sol-8-water-ice-survey";
    state.turn.decisionMade = true;
    state.turn.selectedChoiceId = "scan-water-ice";
    state.turn.powerAllocation = {
        greenhouse: 0,
        rover: 2,
        shelter: 0,
        total: 2,
        confirmed: true
    };
    state.resources.power = 46;
    state.resources.water = 38;
    state.objectives.waterIceResearch = true;
    state.history.push({
        sol: 8,
        choiceId: "scan-water-ice",
        resourceChanges: { power: -7 }
    });

    const saved = saveAutosave(state);

    assert.equal(saved.success, true);

    const loaded = readAutosave();

    assert.equal(loaded.status, "valid");
    assert.equal(loaded.gameState.mission.scenarioId, "may-2024-solar-storm");
    assert.equal(loaded.gameState.mission.currentSol, 8);
    assert.equal(loaded.gameState.mission.powerPlanningEnabled, true);
    assert.equal(loaded.gameState.turn.selectedChoiceId, "scan-water-ice");
    assert.equal(loaded.gameState.turn.powerAllocation.rover, 2);
    assert.equal(loaded.gameState.objectives.waterIceResearch, true);
    assert.equal(loaded.gameState.resources.power, 46);
    assert.equal(loaded.gameState.resources.water, 38);
    assert.equal(loaded.gameState.history.length, 1);
});

test("completed missions can be saved and restored", () => {
    const state = createInitialGameState();

    state.mission.currentSol = 14;
    state.mission.status = "success";
    state.mission.finalReportTransmitted = true;
    Object.keys(state.objectives).forEach(key => {
        state.objectives[key] = true;
    });

    assert.equal(saveAutosave(state).success, true);
    assert.equal(readAutosave().status, "valid");
    assert.equal(readAutosave().gameState.mission.status, "success");
});

test("invalid resource values are rejected instead of saved", () => {
    const state = createInitialGameState();
    state.resources.water = 101;

    assert.equal(validateSavedGameState(state), false);
    assert.equal(saveAutosave(state).success, false);
    assert.equal(readAutosave().status, "empty");
});

test("a saved decision without a selected choice is rejected", () => {
    const state = createInitialGameState();
    state.turn.decisionMade = true;

    assert.equal(validateSavedGameState(state), false);
});

test("a confirmed power plan is rejected when advanced planning is off", () => {
    const state = createInitialGameState();
    state.turn.decisionMade = true;
    state.turn.selectedChoiceId = "some-choice";
    state.turn.powerAllocation = {
        greenhouse: 0,
        rover: 0,
        shelter: 0,
        total: 0,
        confirmed: true
    };

    assert.equal(validateSavedGameState(state), false);
});

test("corrupted JSON is detected without crashing the game", () => {
    window.localStorage.setItem(AUTOSAVE_KEY, "{not valid json");

    assert.equal(readAutosave().status, "invalid");
});

test("an unsupported save version is rejected", () => {
    window.localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({
            version: AUTOSAVE_VERSION + 1,
            savedAt: new Date().toISOString(),
            gameState: createInitialGameState()
        })
    );

    assert.equal(readAutosave().status, "invalid");
});

test("clearAutosave removes the stored mission", () => {
    assert.equal(saveAutosave(createInitialGameState()).success, true);
    assert.equal(readAutosave().status, "valid");
    assert.equal(clearAutosave().success, true);
    assert.equal(readAutosave().status, "empty");
});

test("storage failures are handled without throwing", () => {
    globalThis.window.localStorage = createStorage({
        setItem() {
            throw new Error("Storage quota exceeded");
        },
        removeItem() {
            throw new Error("Storage unavailable");
        }
    });

    assert.equal(saveAutosave(createInitialGameState()).success, false);
    assert.equal(clearAutosave().success, false);
});
