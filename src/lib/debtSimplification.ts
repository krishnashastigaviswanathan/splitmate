export interface MemberBalanceInfo {
  userId: string;
  name: string;
  email: string;
  upiId?: string | null;
  totalPaid: number; // in smallest unit
  totalSplit: number; // in smallest unit
  settlementsSent: number; // in smallest unit
  settlementsReceived: number; // in smallest unit
  netBalance: number; // in smallest unit: positive = gets back, negative = owes
}

export interface SimplifiedDebt {
  fromUserId: string;
  fromUserName: string;
  fromUserUpi?: string | null;
  toUserId: string;
  toUserName: string;
  toUserUpi?: string | null;
  amount: number; // in smallest unit
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
  upiId?: string | null;
}

interface ExpenseWithSplits {
  paidById: string;
  amount: number;
  splits: {
    userId: string;
    amount: number;
  }[];
}

interface SettlementRecord {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/**
 * Calculates net balance for every member in the group
 */
export function calculateMemberBalances(
  members: UserSummary[],
  expenses: ExpenseWithSplits[],
  settlements: SettlementRecord[]
): Map<string, MemberBalanceInfo> {
  const balanceMap = new Map<string, MemberBalanceInfo>();

  for (const m of members) {
    balanceMap.set(m.id, {
      userId: m.id,
      name: m.name,
      email: m.email,
      upiId: m.upiId,
      totalPaid: 0,
      totalSplit: 0,
      settlementsSent: 0,
      settlementsReceived: 0,
      netBalance: 0,
    });
  }

  // Accumulate expenses
  for (const exp of expenses) {
    const payer = balanceMap.get(exp.paidById);
    if (payer) {
      payer.totalPaid += exp.amount;
    }
    for (const split of exp.splits) {
      const splitter = balanceMap.get(split.userId);
      if (splitter) {
        splitter.totalSplit += split.amount;
      }
    }
  }

  // Accumulate settlements
  for (const st of settlements) {
    const sender = balanceMap.get(st.fromUserId);
    if (sender) {
      sender.settlementsSent += st.amount;
    }
    const receiver = balanceMap.get(st.toUserId);
    if (receiver) {
      receiver.settlementsReceived += st.amount;
    }
  }

  // Calculate final net balance: Total Paid + Settlements Sent - Total Splits - Settlements Received
  for (const info of Array.from(balanceMap.values())) {
    info.netBalance =
      info.totalPaid + info.settlementsSent - (info.totalSplit + info.settlementsReceived);
  }

  return balanceMap;
}

/**
 * Greedy Debt-Simplification Algorithm:
 * Matches the largest debtor with the largest creditor to minimize the total number of transactions.
 */
export function simplifyDebts(
  memberBalances: Map<string, MemberBalanceInfo>
): SimplifiedDebt[] {
  // Creditors: netBalance > 0 (owed money)
  // Debtors: netBalance < 0 (owe money)
  const creditors: { userId: string; name: string; upiId?: string | null; amount: number }[] = [];
  const debtors: { userId: string; name: string; upiId?: string | null; amount: number }[] = [];

  for (const info of Array.from(memberBalances.values())) {
    if (info.netBalance > 0) {
      creditors.push({
        userId: info.userId,
        name: info.name,
        upiId: info.upiId,
        amount: info.netBalance,
      });
    } else if (info.netBalance < 0) {
      debtors.push({
        userId: info.userId,
        name: info.name,
        upiId: info.upiId,
        amount: -info.netBalance, // make positive for easier arithmetic
      });
    }
  }

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedDebt[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    // Settle the minimum of what debtor owes and creditor is owed
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.name,
        fromUserUpi: debtor.upiId,
        toUserId: creditor.userId,
        toUserName: creditor.name,
        toUserUpi: creditor.upiId,
        amount: settleAmount,
      });

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
    }

    if (debtor.amount === 0) dIdx++;
    if (creditor.amount === 0) cIdx++;
  }

  return transactions;
}
