/**
 * Bangladesh mobile number normalization.
 *
 * Accepts the common formats users actually type and returns a canonical
 * E.164 string (+8801XXXXXXXXX) suitable for storage and SMS delivery, or
 * null if the input is not a valid BD mobile number.
 *
 * Valid local form: 01[3-9]XXXXXXXX (operator prefixes 013–019), i.e. after
 * stripping the country/trunk prefix we expect 1[3-9] followed by 8 digits.
 *
 *   01712345678        -> +8801712345678
 *   +8801712345678     -> +8801712345678
 *   8801712345678      -> +8801712345678
 *   017-1234 5678      -> +8801712345678
 */
export function normalizeBdPhone(input: string | null | undefined): string | null {
  if (!input) return null;

  const digits = input.replace(/\D/g, '');

  let local: string;
  if (digits.startsWith('880')) {
    local = digits.slice(3);
  } else if (digits.startsWith('0')) {
    local = digits.slice(1);
  } else {
    local = digits;
  }

  if (!/^1[3-9]\d{8}$/.test(local)) {
    return null;
  }

  return `+880${local}`;
}
