const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with realistic roommate expense data...");

  // Clean existing data
  await prisma.expenseComment.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const rahul = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "rahul@roommates.app",
      passwordHash,
      upiId: "rahul.sharma@okhdfcbank",
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya@roommates.app",
      passwordHash,
      upiId: "priya.patel@okaxis",
    },
  });

  const arjun = await prisma.user.create({
    data: {
      name: "Arjun Verma",
      email: "arjun@roommates.app",
      passwordHash,
      upiId: "arjun.verma@icici",
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: "Sneha Iyer",
      email: "sneha@roommates.app",
      passwordHash,
      upiId: "sneha.iyer@paytm",
    },
  });

  const members = [rahul, priya, arjun, sneha];

  // 2. Create Primary Group: Apartment 4B
  const group = await prisma.group.create({
    data: {
      name: "Apartment 4B (Koramangala)",
      emoji: "🏠",
      currency: "INR",
      monthlyGoal: 3500000, // ₹35,000 monthly budget goal
      inviteCode: "APT4B9",
      members: {
        create: [
          { userId: rahul.id },
          { userId: priya.id },
          { userId: arjun.id },
          { userId: sneha.id },
        ],
      },
    },
  });

  // 2b. Create a secondary group: Goa Trip 2026
  const goaGroup = await prisma.group.create({
    data: {
      name: "Goa Beach Trip",
      emoji: "🏖️",
      currency: "INR",
      monthlyGoal: 2000000, // ₹20,000
      inviteCode: "GOA2026",
      members: {
        create: [
          { userId: rahul.id },
          { userId: arjun.id },
          { userId: sneha.id },
        ],
      },
    },
  });

  console.log(`Created groups: ${group.name} and ${goaGroup.name}`);

  // Helper for equal splits in paise
  function makeEqualSplits(expenseAmount, userList) {
    const count = userList.length;
    const base = Math.floor(expenseAmount / count);
    const remainder = expenseAmount % count;
    return userList.map((u, i) => ({
      userId: u.id,
      amount: base + (i < remainder ? 1 : 0),
    }));
  }

  // 3. Create Expenses across the last 6 months
  const now = new Date();

  // Helper to get date N months ago with specific day
  const getDateMonthsAgo = (monthsAgo, day = 5) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
    return d;
  };

  const sampleExpenses = [
    // 5 months ago
    {
      description: "ACT High-Speed Fiber Internet",
      amount: 149900, // ₹1,499.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      recurringInterval: "MONTHLY",
      paidById: rahul.id,
      date: getDateMonthsAgo(5, 3),
      splits: makeEqualSplits(149900, members),
    },
    {
      description: "Organic Groceries & Cleaning Supplies",
      amount: 480000, // ₹4,800.00
      category: "Groceries",
      splitType: "EQUAL",
      isRecurring: false,
      paidById: priya.id,
      date: getDateMonthsAgo(5, 12),
      splits: makeEqualSplits(480000, members),
    },
    {
      description: "House Maid & Cook Salary",
      amount: 1200000, // ₹12,000.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      recurringInterval: "MONTHLY",
      paidById: arjun.id,
      date: getDateMonthsAgo(5, 28),
      splits: makeEqualSplits(1200000, members),
    },

    // 4 months ago
    {
      description: "BESCOM Electricity Bill",
      amount: 285000, // ₹2,850.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      recurringInterval: "MONTHLY",
      paidById: sneha.id,
      date: getDateMonthsAgo(4, 5),
      splits: makeEqualSplits(285000, members),
    },
    {
      description: "Friday Pizza Party & Drinks",
      amount: 320000, // ₹3,200.00
      category: "Food & Dining",
      splitType: "EQUAL",
      isRecurring: false,
      paidById: rahul.id,
      date: getDateMonthsAgo(4, 18),
      splits: makeEqualSplits(320000, members),
    },
    {
      description: "Cook & Maid Monthly Pay",
      amount: 1200000, // ₹12,000.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      paidById: arjun.id,
      date: getDateMonthsAgo(4, 28),
      splits: makeEqualSplits(1200000, members),
    },

    // 3 months ago (Budget under 80%)
    {
      description: "ACT Fiber Internet Renewal",
      amount: 149900,
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      paidById: rahul.id,
      date: getDateMonthsAgo(3, 2),
      splits: makeEqualSplits(149900, members),
    },
    {
      description: "Costco Bulk Kitchen Restock",
      amount: 650000, // ₹6,500.00
      category: "Groceries",
      splitType: "EQUAL",
      isRecurring: false,
      paidById: priya.id,
      date: getDateMonthsAgo(3, 10),
      splits: makeEqualSplits(650000, members),
    },
    {
      description: "Movie Night: IMAX Tickets & Popcorn",
      amount: 240000, // ₹2,400.00
      category: "Entertainment",
      splitType: "EQUAL",
      isRecurring: false,
      paidById: sneha.id,
      date: getDateMonthsAgo(3, 22),
      splits: makeEqualSplits(240000, members),
    },

    // 2 months ago (Budget reached ~85% - Amber)
    {
      description: "Cook & Maid Monthly Salary",
      amount: 1200000,
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      paidById: arjun.id,
      date: getDateMonthsAgo(2, 1),
      splits: makeEqualSplits(1200000, members),
    },
    {
      description: "BigBasket Mega Grocery Haul",
      amount: 980000, // ₹9,800.00
      category: "Groceries",
      splitType: "EQUAL",
      isRecurring: false,
      paidById: priya.id,
      date: getDateMonthsAgo(2, 14),
      splits: makeEqualSplits(980000, members),
    },
    {
      description: "Water Purifier RO Annual Service & Filter Change",
      amount: 450000, // ₹4,500.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: false,
      paidById: rahul.id,
      date: getDateMonthsAgo(2, 20),
      splits: makeEqualSplits(450000, members),
    },
    {
      description: "Swiggy Feast - Biryani & Kebabs",
      amount: 320000, // ₹3,200.00
      category: "Food & Dining",
      splitType: "EQUAL",
      isRecurring: false,
      paidById: sneha.id,
      date: getDateMonthsAgo(2, 26),
      splits: makeEqualSplits(320000, members),
    },

    // 1 month ago (Past month)
    {
      description: "BESCOM Power Bill - AC Summer spike",
      amount: 420000, // ₹4,200.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      paidById: sneha.id,
      date: getDateMonthsAgo(1, 4),
      splits: makeEqualSplits(420000, members),
    },
    {
      description: "ACT Wi-Fi Router Replacement & Bill",
      amount: 299900, // ₹2,999.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: false,
      paidById: rahul.id,
      date: getDateMonthsAgo(1, 10),
      splits: makeEqualSplits(299900, members),
    },
    {
      description: "Cook & Maid Monthly Salary",
      amount: 1200000,
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      paidById: arjun.id,
      date: getDateMonthsAgo(1, 28),
      splits: makeEqualSplits(1200000, members),
    },

    // Current month (Current month has multiple expenses demonstrating near budget / active tracking)
    {
      description: "Rent Maintenance & Society Dues",
      amount: 1400000, // ₹14,000.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      recurringInterval: "MONTHLY",
      nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      paidById: rahul.id,
      date: new Date(now.getFullYear(), now.getMonth(), 2),
      splits: makeEqualSplits(1400000, members),
    },
    {
      description: "Blinkit Daily Essentials & Cooking Oil",
      amount: 385000, // ₹3,850.00
      category: "Groceries",
      splitType: "EQUAL",
      isRecurring: false,
      paidById: priya.id,
      date: new Date(now.getFullYear(), now.getMonth(), 6),
      splits: makeEqualSplits(385000, members),
    },
    {
      description: "ACT High-Speed Fiber Internet",
      amount: 149900, // ₹1,499.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      recurringInterval: "MONTHLY",
      nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      paidById: arjun.id,
      date: new Date(now.getFullYear(), now.getMonth(), 7),
      splits: makeEqualSplits(149900, members),
    },
    {
      description: "Dinner at Toit Brewpub (Itemized)",
      amount: 640000, // ₹6,400.00
      category: "Food & Dining",
      splitType: "ITEMIZED",
      receiptUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      isRecurring: false,
      paidById: sneha.id,
      date: new Date(now.getFullYear(), now.getMonth(), 10),
      splits: [
        { userId: rahul.id, amount: 160000 },
        { userId: priya.id, amount: 150000 },
        { userId: arjun.id, amount: 180000 },
        { userId: sneha.id, amount: 150000 },
      ],
    },
    {
      description: "House Cook & Maid Salary",
      amount: 1200000, // ₹12,000.00
      category: "Rent & Utilities",
      splitType: "EQUAL",
      isRecurring: true,
      recurringInterval: "MONTHLY",
      nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      paidById: rahul.id,
      date: new Date(now.getFullYear(), now.getMonth(), 12),
      splits: makeEqualSplits(1200000, members),
    },
  ];

  for (const expData of sampleExpenses) {
    const exp = await prisma.expense.create({
      data: {
        description: expData.description,
        amount: expData.amount,
        category: expData.category,
        splitType: expData.splitType,
        receiptUrl: expData.receiptUrl || null,
        isRecurring: expData.isRecurring,
        recurringInterval: expData.recurringInterval || null,
        nextDueDate: expData.nextDueDate || null,
        groupId: group.id,
        paidById: expData.paidById,
        expenseDate: expData.date,
        splits: {
          create: expData.splits,
        },
      },
    });

    // Add a friendly comment on dining or big expenses
    if (expData.category === "Food & Dining") {
      await prisma.expenseComment.create({
        data: {
          expenseId: exp.id,
          userId: priya.id,
          content: "That wood-fired sourdough pizza was incredible! Thanks for picking up the tab Sneha.",
        },
      });
      await prisma.expenseComment.create({
        data: {
          expenseId: exp.id,
          userId: rahul.id,
          content: "Loved it! Proportional item split with service tax was super smooth.",
        },
      });
    }
  }

  // 4. Create a past settlement
  await prisma.settlement.create({
    data: {
      groupId: group.id,
      fromUserId: priya.id,
      toUserId: rahul.id,
      amount: 400000, // ₹4,000.00
      note: "Settled up for society maintenance",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 15),
    },
  });

  // 5. Add expenses for Goa group
  const goaExpenses = [
    {
      description: "Beach Villa Stay (3 Nights)",
      amount: 1500000, // ₹15,000
      category: "Travel",
      splitType: "EQUAL",
      paidById: rahul.id,
      date: new Date(now.getFullYear(), now.getMonth(), 5),
      splits: makeEqualSplits(1500000, [rahul, arjun, sneha]),
    },
    {
      description: "Scooter Rentals & Fuel",
      amount: 240000, // ₹2,400
      category: "Travel",
      splitType: "EQUAL",
      paidById: arjun.id,
      date: new Date(now.getFullYear(), now.getMonth(), 6),
      splits: makeEqualSplits(240000, [rahul, arjun, sneha]),
    },
  ];

  for (const gExp of goaExpenses) {
    await prisma.expense.create({
      data: {
        description: gExp.description,
        amount: gExp.amount,
        category: gExp.category,
        splitType: gExp.splitType,
        groupId: goaGroup.id,
        paidById: gExp.paidById,
        expenseDate: gExp.date,
        splits: {
          create: gExp.splits,
        },
      },
    });
  }

  // 6. Create initial Roommate Messages
  await prisma.roommateMessage.createMany({
    data: [
      {
        groupId: group.id,
        userId: rahul.id,
        content: "Guys, Wi-Fi bill is logged for this month! Speed test shows 300 Mbps so no excuses for missing Standup 🚀",
        emoji: "📡",
        tag: "CHAT",
        createdAt: new Date(now.getFullYear(), now.getMonth(), 8, 11, 30),
      },
      {
        groupId: group.id,
        userId: priya.id,
        content: "Who left an empty Dahi container in the fridge door? It has evolved into modern art 🎨",
        emoji: "🥛",
        tag: "CHORE",
        createdAt: new Date(now.getFullYear(), now.getMonth(), 10, 16, 45),
      },
      {
        groupId: group.id,
        userId: sneha.id,
        content: "Ordering Toit wood-fired pizzas tonight! Drop your toppings in the chat or forever hold your peace 🍕🤤",
        emoji: "🍕",
        tag: "FOOD",
        createdAt: new Date(now.getFullYear(), now.getMonth(), 10, 19, 15),
      },
      {
        groupId: group.id,
        userId: arjun.id,
        content: "Chai is boiling on the stove! First 3 roommates in the kitchen get hot ginger tea ☕✨",
        emoji: "☕",
        tag: "CHAI",
        createdAt: new Date(now.getFullYear(), now.getMonth(), 12, 17, 20),
      },
    ],
  });

  console.log("Database seeded successfully!");
  console.log("Demo logins created:");
  console.log("  1. rahul@roommates.app / password123 (Rahul Sharma)");
  console.log("  2. priya@roommates.app / password123 (Priya Patel)");
  console.log("  3. arjun@roommates.app / password123 (Arjun Verma)");
  console.log("  4. sneha@roommates.app / password123 (Sneha Iyer)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
