module.exports = {
  config: {
    name: "wheel",
    version: "3.3",
    author: "xnil6x + Modified by Yeasin",
    shortDescription: "🎡 Ultra-Stable Wheel Game",
    longDescription: "Guaranteed smooth spinning experience with automatic fail-safes",
    category: "Game",
    guide: {
      en: "{p}wheel <amount>"
    }
  },

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

      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000; // 2 hours
      if (!this.userSpinRecords[senderID]) this.userSpinRecords[senderID] = [];
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

      this.userSpinRecords[senderID].push(now);

      // Get user name for mention
      const userInfo = await api.getUserInfo(senderID);
      const name = userInfo[senderID]?.name || "Someone";

      const { result, winAmount } = await this.executeSpin(api, threadID, betAmount);
      const newBalance = user.money + winAmount;

      await usersData.set(senderID, { money: newBalance });

      const spinsLeft = 30 - this.userSpinRecords[senderID].length;

      // Prepare mention array
      const mentions = [{ tag: name, id: senderID }];

      // Add crown emoji before user name in message body
      const text = `‎👑 ${name}, you spun the wheel!\n\n` +
        this.generateResultText(result, winAmount, betAmount, newBalance) +
        `\n🔁 Spins Left: ${spinsLeft}/30`;

      await api.sendMessage({ body: text, mentions }, threadID);

      // unsend off as per request (no auto unsend)
      // If you want unsend on, uncomment below:
      /*
      setTimeout(() => {
        api.unsendMessage(messageID).catch(() => { });
      }, 30000);
      */

    } catch (error) {
      console.error("Wheel System Error:", error);
      return api.sendMessage(
        `🎡 System recovered! Your ${this.formatMoney(betAmount)} coins are safe. Try spinning again.`,
        threadID
      );
    }
  },

  sanitizeBetAmount: function (input) {
    const amount = parseInt(String(input || "").replace(/[^0-9]/g, ""));
    return amount > 0 ? amount : null;
  },

  isValidUserData: function (user) {
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

  generateResultText: function (result, winAmount, betAmount, newBalance) {
    const resultText = [
      `🎡 Wheel stopped on: ${result.emoji}`,
      "",
      this.getOutcomeText(result.multiplier, winAmount, betAmount),
      `💰 New Balance: ${this.formatMoney(newBalance)}`
    ].join("\n");

    return resultText;
  },

  getOutcomeText: function (multiplier, winAmount, betAmount) {
    if (multiplier < 1) return `❌ Lost: ${this.formatMoney(betAmount * 0.5)}`;
    if (multiplier === 1) return "➖ Broke even";
    return `✅ Won ${multiplier}X! (+${this.formatMoney(winAmount)})`;
  },

  formatMoney: function (amount) {
    const units = ["", "K", "M", "B"];
    let unitIndex = 0;

    while (amount >= 1000 && unitIndex < units.length - 1) {
      amount /= 1000;
      unitIndex++;
    }

    return amount.toFixed(amount % 1 ? 2 : 0) + units[unitIndex];
  }
};
