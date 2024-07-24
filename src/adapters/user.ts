export function usernameToUsernameSafe(username: string): string {
    return username.toLowerCase().replace(" ", "_");
}