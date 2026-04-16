export function assertNotNull(val: any): asserts val {
    if (val === null) {
        throw new Error("null assertion error");
    }
}

export function assertNever(val: never): never {
    throw new Error(`unexpected value: ${JSON.stringify(val)}`);
}
