/** @description Concrete fieldless identity used for one opaque logical Console handle. */
export class ConsoleHandle {
    /** @description Creates and freezes one identity-bearing logical handle. */
    constructor() {
        Object.freeze(this);
    }
}
