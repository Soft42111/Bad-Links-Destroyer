const unidecode = require('unidecode');

/**
 * Normalizes a string to detect obfuscated links.
 * @param {string} text 
 * @returns {string}
 */
function normalizeLink(text) {
    // 1. Remove hidden/zero-width characters immediately
    let normalized = text
        .replace(/\u0441/g, 'c')
        .replace(/\u0430/g, 'a')
        .replace(/\u03b5/g, 'e')
        .replace(/[\u200b\u200c\u200d\ufeff\u2060]/g, '');

    // 2. Remove Markdown & formatting (keeping letters, numbers, and core URL symbols)
    // We remove: * ~ ` > | [ ] _ (wait, underscores are often in URLs, but bold uses them too)
    // To be safe against bold/italic obfuscation like __https://__, we remove them.
    normalized = normalized.replace(/[\*_~`>\|\[\]]/g, '');
    
    // 3. Remove all whitespace
    normalized = normalized.replace(/\s+/g, '');

    // 4. Normalize remaining homoglyphs
    normalized = unidecode(normalized).toLowerCase();

    // 5. Handle the Protocol/Separator mess
    // Identify if it was meant to be http or https
    const isHttps = normalized.includes('https');
    const isHttp = !isHttps && normalized.includes('http');

    // Strip everything before and including the (possibly mangled) protocol part
    // We look for the first occurrence of "http" or "https"
    if (isHttps) {
        normalized = normalized.substring(normalized.indexOf('https') + 5);
    } else if (isHttp) {
        normalized = normalized.substring(normalized.indexOf('http') + 4);
    }

    // Now 'normalized' starts with the separator mess (e.g., "://///example.com")
    // Clean up leading colons and slashes
    normalized = normalized.replace(/^[:/]+/, '');

    // Reconstruct
    if (isHttps) {
        normalized = 'https://' + normalized;
    } else if (isHttp) {
        normalized = 'http://' + normalized;
    }

    return normalized;
}

module.exports = { normalizeLink };
