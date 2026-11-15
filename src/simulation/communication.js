
/*
    ARES-6
    COMMUNICATION SYSTEM

    Manages messages between Mars and Earth.
*/


// =====================================
// 1. SEND MESSAGE TO EARTH
// =====================================

export function sendMessageToEarth(gameState, message) {

    if (
        !gameState?.mission ||
        !gameState?.communication ||
        !gameState?.supportAssets
    ) {

        return {
            success: false,
            message: "Invalid game state."
        };

    }

    if (gameState.mission.status !== "playing") {

        return {
            success: false,
            message: "Mission is not active."
        };

    }


    // Validate message.
    if (
        typeof message !== "string" ||
        message.trim() === ""
    ) {

        return {
            success: false,
            message: "Message cannot be empty."
        };

    }


    // Check antenna availability.
    if (!gameState.supportAssets.antennaOperational) {

        return {
            success: false,
            message: "Communication antenna is unavailable."
        };

    }


    // Prevent multiple pending messages.
    if (gameState.communication.pendingReply !== null) {

        return {
            success: false,
            message: "A message is already waiting for a reply."
        };

    }


    // Calculate response delivery Sol.
    const currentSol = gameState.mission.currentSol;

    if (currentSol >= gameState.mission.totalSols) {

        return {
            success: false,
            message: "Not enough mission time for a reply."
        };

    }


    const deliverOnSol = currentSol + 1;


    // Store the pending message.
    gameState.communication.pendingReply = {

        message: message.trim(),

        sentOnSol: currentSol,

        deliverOnSol: deliverOnSol

    };


    return {

        success: true,

        message: "Message sent to Earth.",

        sentOnSol: currentSol,

        expectedReplySol: deliverOnSol

    };

}


// =====================================
// 2. PROCESS PENDING COMMUNICATION
// =====================================

export function processCommunication(gameState) {

    if (
        !gameState?.mission ||
        !gameState?.communication
    ) {

        return {
            success: false,
            message: "Invalid game state."
        };

    }

    if (gameState.mission.status !== "playing") {

        return {
            success: false,
            message: "Mission is not active."
        };

    }


    const pending =
        gameState.communication.pendingReply;


    // No message is waiting.
    if (pending === null) {

        return {

            success: true,

            delivered: false,

            message: "No pending messages."

        };

    }


    // Check whether the reply has arrived.
    if (gameState.mission.currentSol < pending.deliverOnSol) {

        return {

            success: true,

            delivered: false,

            expectedReplySol: pending.deliverOnSol,

            message: "Earth's reply is still travelling."

        };

    }


    // Create a simple fictional Earth response.
    const reply = {

        receivedOnSol: gameState.mission.currentSol,

        originalMessage: pending.message,

        message:
            "Earth received your message. " +
            "Keep monitoring your outpost systems."

    };


    // Save the received message.
    gameState.communication.receivedMessages.push(reply);


    // Clear the pending message.
    gameState.communication.pendingReply = null;


    return {

        success: true,

        delivered: true,

        reply: reply,

        message: "Earth's reply has arrived."

    };

}
