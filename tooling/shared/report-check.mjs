/**
 * @description Prints one tooling check result and marks the process as failed on violations.
 * @param {string[]} violations - Human-readable violations collected by the check.
 * @param {string} successMessage - Message printed when no violations exist.
 * @returns {void}
 */
export function reportCheck(violations, successMessage) {
    if (violations.length > 0) {
        console.error(violations.join("\n"));
        process.exitCode = 1;
        return;
    }

    console.log(successMessage);
}
