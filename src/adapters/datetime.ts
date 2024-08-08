export function getCurrentUnixTimestamp() {
    return Math.trunc(new Date().valueOf() / 1000);
}
