module.exports = {
  config: {
    name: "slots",
    aliases: ["slot", "spin"],
    version: "1.3",
    author: "xnil6x",
    countDown: 3,
    role: 0,
    description: "🎰 Ultra-stylish slot machine with balanced odds",
    category: "game",
    guide: {
      en: "Use: {pn} [bet amount]"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const bet = parseInt(args[0]);

    const formatMoney = (amount) => {
      if (isNaN(amount)) return "💲0";
      amount = Number(amount);
      const scales = [
        { value: 1e15, suffix: 'Q', color: '🌈' },
        { value: 1e12, suffix: 'T', color: '✨' },
        { value: 1e9, suffix: 'B', color: '💎' },
        { value: 1e6, suffix: 'M', color: '💰' },
        { value: 1e3, suffix: 'k', color: '💵' }
      ];
      const scale = scales.find(s => amount >= s.value);
      if (scale) {
        const scaledValue = amount / scale.value;
        return `${scale.color}${scaledValue.toFixed(2)}${scale.suffix}`;
      }
      return `💲${amount.toLocaleString()}`;
    };

    if (isNaN(bet) || bet <= 0)
      return message.reply("🔴 𝗘𝗥𝗥𝗢𝗥: Please enter a valid bet amount!");

    if (bet > 10000000)
      return message.reply("⚠️ 𝗟𝗜𝗠𝗜𝗧: Maximum bet is 10,000,000 coins!");

    const user = await usersData.get(senderID);

    // --- PLAY LIMIT CHECK ---
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    let playCount = user.slotsPlayCount || 0;
    let lastPlay = user.slotsLastPlay || 0;
    const now = Date.now();

    if (now - lastPlay > SIX_HOURS) {
      playCount = 0;
    }

    if (playCount >= 20) {
      const waitTime = SIX_HOURS - (now - lastPlay);
      const minutes = Math.ceil(waitTime / 60000);
      return message.reply(`⚠️ 𝗟𝗜𝗠𝗜𝗧 𝗥𝗘𝗔𝗖𝗛𝗘𝗗: You have played 20 times in the last 6 hours. Please wait ${minutes} minute(s) to play again.`);
    }

    if (user.money < bet)
      return message.reply(`🔴 𝗜𝗡𝗦𝗨𝗙𝗙𝗜𝗖𝗜𝗘𝗡𝗧 𝗙𝗨𝗡𝗗𝗦: You need ${formatMoney(bet - user.money)} more to play!`);

    const symbols = [
      { emoji: "🍒", weight: 30 },
      { emoji: "🍋", weight: 25 },
      { emoji: "🍇", weight: 20 },
      { emoji: "🍉", weight: 15 },
      { emoji: "⭐", weight: 7 },
      { emoji: "7️⃣", weight: 3 }
    ];

    const roll = () => {
      const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
      let random = Math.random() * totalWeight;
      for (const symbol of symbols) {
        if (random < symbol.weight) return symbol.emoji;
        random -= symbol.weight;
      }
      return symbols[0].emoji;
    };

    const slot1 = roll();
    const slot2 = roll();
    const slot3 = roll();

    let winnings = 0;
    let outcome = "";
    let winType = "";

    if (slot1 === slot2 && slot2 === slot3) {
      winnings = bet * 4;
      outcome = "🔥 𝗠𝗘𝗚𝗔 𝗝𝗔𝗖𝗞𝗣𝗢𝗧! 𝗧𝗥𝗜𝗣𝗟𝗘 𝗠𝗔𝗧𝗖𝗛!";
      winType = "💎 𝗠𝗔𝗫 𝗪𝗜𝗡";
    } 
    else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      winnings = bet * 4;
      outcome = "💰 2 matching symbols!";
      winType = "🌟 𝗪𝗜𝗡";
    } 
    else if (Math.random() < 0.5) {
      winnings = bet * 4;
      outcome = "🎯 𝗟𝗨𝗖𝗞𝗬 𝗕𝗢𝗡𝗨𝗦 𝗪𝗜𝗡!";
      winType = "🍀 𝗕𝗢𝗡𝗨𝗦";
    } 
    else {
      winnings = -bet;
      outcome = "💸 𝗕𝗘𝗧𝗧𝗘𝗥 𝗟𝗨𝗖𝗞 𝗡𝗘𝗫𝗧 𝗧𝗜𝗠𝗘!";
      winType = "☠️ 𝗟𝗢𝗦𝗦";
    }

    playCount += 1;

    await usersData.set(senderID, {
      money: user.money + winnings,
      slotsPlayCount: playCount,
      slotsLastPlay: now
    });

    const finalBalance = user.money + winnings;

    const slotBox = 
      "╔═════════════════════╗\n" +
      "║  🎰 𝗦𝗟𝗢𝗧 𝗠𝗔𝗖𝗛𝗜𝗡𝗘 🎰  ║\n" +
      "╠═════════════════════╣\n" +
      `║     [ ${slot1} | ${slot2} | ${slot3} ]     ║\n` +
      "╚═════════════════════╝";

    const resultColor = winnings >= 0 ? "🟢" : "🔴";
    const resultText = winnings >= 0 ? `🏆 𝗪𝗢𝗡: ${formatMoney(winnings)}` : `💸 𝗟𝗢𝗦𝗧: ${formatMoney(bet)}`;

    const messageContent = 
      `${slotBox}\n\n` +
      `🎯 𝗥𝗘𝗦𝗨𝗟𝗧: ${outcome}\n` +
      `${winType ? `${winType}\n` : ""}` +
      `\n${resultColor} ${resultText}` +
      `\n💰 𝗕𝗔𝗟𝗔𝗡𝗖𝗘: ${formatMoney(finalBalance)}` +
      `\n\n💡 𝗧𝗜𝗣: Higher bets increase jackpot chances!`;

    return message.reply(messageContent);
  }
};
