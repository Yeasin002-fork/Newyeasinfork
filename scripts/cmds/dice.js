function formatMoney(num) {
  if (num >= 1e15) return (num / 1e15).toFixed(2).replace(/\.00$/, "") + "Q";
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, "") + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, "") + "K";
  return num.toString();
}

module.exports = {
  config: {
    name: "dice",
    version: "2.1",
    author: "xnil6x + Modified by Yeasin",
    shortDescription: "🎲 Dice Game | Bet & win coins!",
    longDescription: "Bet coins and roll the dice. Dice value decides your fate.",
    category: "game",
    guide: {
      en: "{p}dice <bet amount>\nExample: {p}dice 1000"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID } = event;
    let userData = await usersData.get(senderID);

    if (!userData || userData.money === undefined) {
      return api.sendMessage("❌ Account issue! Please try again later.", threadID);
    }

    const betAmount = parseInt(args[0]);
    if (isNaN(betAmount) || betAmount <= 0) {
      return api.sendMessage("⚠️ Invalid usage!\nUse like: {p}dice <bet amount>\nExample: {p}dice 1000", threadID);
    }

    if (betAmount > 10000000) {
      return api.sendMessage("⚠️ Bet limit exceeded!\nMax bet: 10,000,000 coins.", threadID);
    }

    if (betAmount > userData.money) {
      return api.sendMessage(`❌ You only have ${formatMoney(userData.money)} coins!`, threadID);
    }

    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    if (!userData.dicePlay) userData.dicePlay = { lastTime: 0, count: 0 };

    if (now - userData.dicePlay.lastTime >= TWO_HOURS) {
      userData.dicePlay.count = 0;
      userData.dicePlay.lastTime = now;
    }

    if (userData.dicePlay.count >= 30) {
      const timeLeft = TWO_HOURS - (now - userData.dicePlay.lastTime);
      const m = Math.floor(timeLeft / 60000);
      const s = Math.floor((timeLeft % 60000) / 1000);
      return api.sendMessage(
        `❌ Dice play limit reached (30/2h).\n⏳ Try again in ${m}m ${s}s.`,
        threadID
      );
    }

    userData.dicePlay.count++;
    userData.dicePlay.lastTime = now;

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let winAmount = 0;
    let resultText = "";
    let multiplier = 0;

    switch (diceRoll) {
      case 1:
      case 2:
        winAmount = -betAmount;
        resultText = `💥 You lost your bet of ${formatMoney(betAmount)}.`;
        break;
      case 3:
        multiplier = 2;
        winAmount = betAmount * multiplier;
        resultText = `🟢 You won x${multiplier} = +${formatMoney(winAmount)}`;
        break;
      case 4:
      case 5:
        multiplier = 3;
        winAmount = betAmount * multiplier;
        resultText = `🔥 You won x${multiplier} = +${formatMoney(winAmount)}`;
        break;
      case 6:
        multiplier = 10;
        winAmount = betAmount * multiplier;
        resultText = `🎉 You won x${multiplier} = +${formatMoney(winAmount)}`;
        break;
    }

    userData.money += winAmount;
    await usersData.set(senderID, userData);

    const spinsLeft = 30 - userData.dicePlay.count;
    const displayName = (userData.name || "Player").replace(/^@/, "");

    return api.sendMessage({
      body: `‎👑 ${displayName} ${resultText}\n🎲 Dice rolled: ${diceRoll}\n💰 New Balance: ${formatMoney(userData.money)}\n🔁 Spins Left: ${spinsLeft}/30`,
      mentions: [{ tag: displayName, id: senderID }]
    }, threadID);
  }
};
