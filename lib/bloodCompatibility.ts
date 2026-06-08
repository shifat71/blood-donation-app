import { BloodGroup } from '@prisma/client';

/**
 * Red blood cell compatibility for whole-blood / packed-RBC donation.
 *
 * Keyed by the RECIPIENT's blood group; the value is the set of DONOR blood
 * groups that can safely give to that recipient. O- is the universal donor and
 * AB+ is the universal recipient.
 *
 * Used to notify every compatible donor about a request — not just exact
 * matches — which materially widens the donor pool during a shortage.
 */
export const COMPATIBLE_DONOR_GROUPS: Record<BloodGroup, BloodGroup[]> = {
  O_NEGATIVE: ['O_NEGATIVE'],
  O_POSITIVE: ['O_NEGATIVE', 'O_POSITIVE'],
  A_NEGATIVE: ['O_NEGATIVE', 'A_NEGATIVE'],
  A_POSITIVE: ['O_NEGATIVE', 'O_POSITIVE', 'A_NEGATIVE', 'A_POSITIVE'],
  B_NEGATIVE: ['O_NEGATIVE', 'B_NEGATIVE'],
  B_POSITIVE: ['O_NEGATIVE', 'O_POSITIVE', 'B_NEGATIVE', 'B_POSITIVE'],
  AB_NEGATIVE: ['O_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'AB_NEGATIVE'],
  AB_POSITIVE: [
    'O_NEGATIVE',
    'O_POSITIVE',
    'A_NEGATIVE',
    'A_POSITIVE',
    'B_NEGATIVE',
    'B_POSITIVE',
    'AB_NEGATIVE',
    'AB_POSITIVE',
  ],
};

/** Donor blood groups that can give to the given recipient blood group. */
export function getCompatibleDonorGroups(recipient: BloodGroup): BloodGroup[] {
  return COMPATIBLE_DONOR_GROUPS[recipient];
}
