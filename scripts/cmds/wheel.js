module.exports = {
  config: {
    name: "wheel",
    version: "3.2",
    author: "xnil6x + Modified by Yeasin",
    shortDescription: "🎡 Ultra-Stable Wheel Game",
    longDescription: "Guaranteed smooth spinning experience with automatic fail-safes",
    category: "Game",
    guide: {
      en: "{p}wheel <amount>"
    }
  },

  // In-memory store for tracking user spins with timestamps
  userSpinRecords: {},

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    let betAmount = 0;

    try {
      betAmount = this.sanitizeBetAmount(args[0]);
      if (!betAmount) {
        return api.sendMessage(
          `❌ Invalid bet amount! Usage: ${global.GoatBot.config.prefix}wheel 500`,
          threadID
        );
      }

      // Max bet limit 10,000,000
      if (betAmount > 10000000) {
        return api.sendMessage(
          `❌ Bet amount exceeds max limit of 10,000,000 coins.`,
          threadID
        );
      }

      const user = await usersData.get(senderID);
      if (!this.isValidUserData(user)) {
        return api.sendMessage(
          "🔒 Account verification failed. Please contact support.",
          threadID
        );
      }

      if (betAmount > user.money) {
        return api.sendMessage(
          `❌ Insufficient balance! You have: ${this.formatMoney(user.money)}`,
          threadID
        );
      }

      // Check 2-hour, 30 spins limit
      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;
      if (!this.userSpinRecords[senderID]) this.userSpinRecords[senderID] = [];
      // Filter spins in last 2 hours
      this.userSpinRecords[senderID] = this.userSpinRecords[senderID].filter(ts => ts > twoHoursAgo);

      if (this.userSpinRecords[senderID].length >= 30) {
        const timeLeft = 2 * 60 * 60 * 1000 - (now - this.userSpinRecords[senderID][0]);
        const m = Math.floor(timeLeft / 60000);
        const s = Math.floor((timeLeft % 60000) / 1000);
        return api.sendMessage(
          `⏳ You've reached 30 spins in 2 hours.\nTry again in ${m}m ${s}s.`,
          threadID
        );
      }

      // Add current spin timestamp
      this.userSpinRecords[senderID].push(now);

      const { result, winAmount } = await this.executeSpin(api, threadID, betAmount);
      const newBalance = user.money + winAmount;

      await usersData.set(senderID, { money: newBalance });

      const spinsLeft = 30 - this.userSpinRecords[senderID].length;

      const sentMessage = await api.sendMessage(
        this.generateResultText(result, winAmount, betAmount, newBalance) + `\n🔁 Spins Left: ${spinsLeft}/30`,
        threadID
      );

      // Auto delete messages after 30 seconds: bot reply + user command
      setTimeout(() => {
        api.unsendMessage(sentMessage.messageID).catch(() => {});
        api.unsendMessage(messageID).catch(() => {});
      }, 30000);

    } catch (error) {
      console.error("Wheel System Error:", error);
      return api.sendMessage(
        `🎡 System recovered! Your ${this.formatMoney(betAmount)} coins are safe. Try spinning again.`,
        threadID
      );
    }
  },

  sanitizeBetAmount: function(input) {
    const amount = parseInt(String(input || "").replace(/[^0-9]/g, ""));
    return amount > 0 ? amount : null;
  },

  isValidUserData: function(user) {
    return user && typeof user.money === "number" && user.money >= 0;
  },

  async executeSpin(api, threadID, betAmount) {
    const wheelSegments = [
      { emoji: "🍒", multiplier: 0.5, weight: 20 },
      { emoji: "🍋", multiplier: 1, weight: 30 },
      { emoji: "🍊", multiplier: 2, weight: 25 },
      { emoji: "🍇", multiplier: 3, weight: 15 },
      { emoji: "💎", multiplier: 5, weight: 7 },
      { emoji: "💰", multiplier: 10, weight: 3 }
    ];

    await api.sendMessage("🌀 Starting the wheel...", threadID);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalWeight = wheelSegments.reduce((sum, seg) => sum + seg.weight, 0);
    const randomValue = Math.random() * totalWeight;
    let cumulativeWeight = 0;

    const result = wheelSegments.find(segment => {
      cumulativeWeight += segment.weight;
      return randomValue <= cumulativeWeight;
    }) || wheelSegments[0];

    const winAmount = Math.floor(betAmount * result.multiplier) - betAmount;

    return { result, winAmount };
  },

  generateResultText: function(result, winAmount, betAmount, newBalance) {
    const resultText = [
      `🎡 WHEEL STOPPED ON: ${result.emoji}`,
      "",
      this.getOutcomeText(result.multiplier, winAmount, betAmount),
      `💰 NEW BALANCE: ${this.formatMoney(newBalance)}`
    ].join("\n");

    return resultText;
  },

  getOutcomeText: function(multiplier, winAmount, betAmount) {
    if (multiplier < 1) return `❌ LOST: ${this.formatMoney(betAmount * 0.5)}`;
    if (multiplier === 1) return "➖ BROKE EVEN";
    return `✅ WON ${multiplier}X! (+${this.formatMoney(winAmount)})`;
  },

  formatMoney: function(amount) {
    const units = ["", "K", "M", "B"];
    let unitIndex = 0;

    while (amount >= 1000 && unitIndex < units.length - 1) {
      amount /= 1000;
      unitIndex++;
    }

    return amount.toFixed(amount % 1 ? 2 : 0) + units[unitIndex];
  }
};
