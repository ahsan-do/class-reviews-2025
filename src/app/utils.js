// src/utils.js
export function hashPassword(password) {
    // Simple hash for demo; replace with bcrypt or similar in production
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = password.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash.toString();
}