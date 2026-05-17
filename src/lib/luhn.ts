/**
 * Card number helpers. Operate on the digit-only projection of the input so
 * callers may pass values with spaces or dashes.
 */

/** Strip every non-digit from `input` and return only the digits. */
function digits(input: string): string {
    return input.replace(/\D/g, '');
}

/**
 * Strips non-digits, then runs the Luhn check. Requires 12-19 digits (the
 * standard PAN length range) — shorter or longer inputs are rejected even if
 * they would otherwise pass the checksum.
 */
export function isValidCardNumber(input: string): boolean {
    const d = digits(input);
    if (d.length < 12 || d.length > 19) return false;

    // Standard Luhn: starting from the rightmost digit, double every second
    // digit; if the doubled value exceeds 9, subtract 9. Sum must be % 10 === 0.
    let sum = 0;
    let double = false;
    for (let i = d.length - 1; i >= 0; i--) {
        let n = d.charCodeAt(i) - 48;   // '0' = 48
        if (double) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        double = !double;
    }
    return sum % 10 === 0;
}

/** Returns the last 4 digits of the stripped input, or '' if too short. */
export function last4(input: string): string {
    const d = digits(input);
    if (d.length < 4) return '';
    return d.slice(-4);
}
