export function assertNotNull(val: any): asserts val {
    if (val === null) {
        throw new Error("null assertion error");
    }
}
