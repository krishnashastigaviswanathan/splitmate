export interface SplitResult {
  userId: string;
  amount: number; // in smallest unit (paise/cents)
}

export interface ItemizedLineItem {
  id: string;
  name: string;
  price: number; // in smallest unit
  assignedUserIds: string[];
}

/**
 * 1. EQUAL SPLIT
 * Divides totalAmount evenly among selected users and distributes remainder paise cleanly
 */
export function calculateEqualSplits(
  totalAmount: number,
  selectedUserIds: string[]
): SplitResult[] {
  if (!selectedUserIds.length || totalAmount <= 0) return [];

  const count = selectedUserIds.length;
  const baseShare = Math.floor(totalAmount / count);
  const remainder = totalAmount % count;

  return selectedUserIds.map((userId, index) => ({
    userId,
    // Give 1 extra paise/cent to the first 'remainder' members
    amount: baseShare + (index < remainder ? 1 : 0),
  }));
}

/**
 * 2. EXACT SPLIT
 * Validates and returns exact splits
 */
export function calculateExactSplits(
  totalAmount: number,
  userAmounts: Record<string, number>
): { splits: SplitResult[]; isValid: boolean; remaining: number } {
  let sum = 0;
  const splits: SplitResult[] = [];

  for (const [userId, amount] of Object.entries(userAmounts)) {
    const val = Math.max(0, Math.round(amount || 0));
    sum += val;
    splits.push({ userId, amount: val });
  }

  const remaining = totalAmount - sum;
  return {
    splits,
    isValid: remaining === 0,
    remaining,
  };
}

/**
 * 3. PERCENTAGE SPLIT
 * Splits by custom percentage shares and handles any fractional rounding cleanly
 */
export function calculatePercentageSplits(
  totalAmount: number,
  userPercentages: Record<string, number>
): { splits: SplitResult[]; isValid: boolean; remaining: number; percentageSum: number } {
  let pctSum = 0;
  const entries = Object.entries(userPercentages);

  for (const [, pct] of entries) {
    pctSum += Number(pct) || 0;
  }

  const isPctValid = Math.abs(pctSum - 100) < 0.05;

  let allocatedAmount = 0;
  let maxPct = -1;
  let maxPctUserId = "";

  const splits: SplitResult[] = entries.map(([userId, pct]) => {
    const p = Number(pct) || 0;
    if (p > maxPct) {
      maxPct = p;
      maxPctUserId = userId;
    }
    const share = Math.floor((p / 100) * totalAmount);
    allocatedAmount += share;
    return { userId, amount: share };
  });

  // Distribute remaining paise/cents to the person with highest percentage
  const remainder = totalAmount - allocatedAmount;
  if (remainder !== 0 && maxPctUserId) {
    const target = splits.find((s) => s.userId === maxPctUserId);
    if (target) {
      target.amount += remainder;
    }
  }

  return {
    splits,
    isValid: isPctValid,
    remaining: totalAmount - splits.reduce((acc, s) => acc + s.amount, 0),
    percentageSum: pctSum,
  };
}

/**
 * 4. ITEMIZED SPLIT
 * Splits individual line items among assigned members, and allocates shared tax/delivery proportionally
 */
export function calculateItemizedSplits(
  items: ItemizedLineItem[],
  sharedFees: number, // tax + delivery + service fees in smallest unit
  allMemberIds: string[]
): { splits: SplitResult[]; subtotal: number; grandTotal: number; isValid: boolean } {
  const userSubtotals: Record<string, number> = {};
  for (const uid of allMemberIds) {
    userSubtotals[uid] = 0;
  }

  let itemsSubtotal = 0;

  // Split each line item
  for (const item of items) {
    itemsSubtotal += item.price;
    const assigned = item.assignedUserIds.filter((id) => allMemberIds.includes(id));
    if (assigned.length > 0) {
      const itemSplits = calculateEqualSplits(item.price, assigned);
      for (const s of itemSplits) {
        userSubtotals[s.userId] = (userSubtotals[s.userId] || 0) + s.amount;
      }
    }
  }

  const grandTotal = itemsSubtotal + sharedFees;
  const splits: SplitResult[] = [];
  let allocatedFees = 0;

  // Allocate shared fee proportionally to user's share of items
  const activeUserIds = Object.keys(userSubtotals).filter((uid) => userSubtotals[uid] > 0);

  for (const uid of allMemberIds) {
    const userItemShare = userSubtotals[uid] || 0;
    let feeShare = 0;

    if (itemsSubtotal > 0 && userItemShare > 0) {
      feeShare = Math.floor((userItemShare / itemsSubtotal) * sharedFees);
      allocatedFees += feeShare;
    }

    splits.push({
      userId: uid,
      amount: userItemShare + feeShare,
    });
  }

  // Remainder fee paise goes to member with highest share
  const remainingFee = sharedFees - allocatedFees;
  if (remainingFee > 0 && activeUserIds.length > 0) {
    let highestSpender = activeUserIds[0];
    let highestAmount = userSubtotals[highestSpender] || 0;
    for (const uid of activeUserIds) {
      if ((userSubtotals[uid] || 0) > highestAmount) {
        highestAmount = userSubtotals[uid];
        highestSpender = uid;
      }
    }
    const target = splits.find((s) => s.userId === highestSpender);
    if (target) {
      target.amount += remainingFee;
    }
  }

  const totalCalculated = splits.reduce((acc, s) => acc + s.amount, 0);

  return {
    splits,
    subtotal: itemsSubtotal,
    grandTotal,
    isValid: totalCalculated === grandTotal,
  };
}
