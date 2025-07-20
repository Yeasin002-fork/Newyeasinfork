const cmd = {
  config: {
    name: "slot",
    aliases: ["bet"],
    version: "1.6.7",
    author: "Nazrul",
    category: "game",
    guide: { en: "{pn} <amount> | me | top | list | help" },
    countDown: 5
  },

  onStart: async function ({ args, message, event, usersData, globalData }) {
    const { senderID: userID } = event;
    const userData = await usersData.get(userID);
    const userName = userData?.name || `User_${userID}`;
    const prefix = (await global.utils.getPrefix(event.threadID));

    let raw = await globalData.get("slotFullData");
    if (!raw) {
      await globalData.create("slotFullData", { data: {} });
      raw = { data: {} };
    }
    const slotData = raw.data;

    let data = slotData[userID] || {
      name: userName,
      wins: 0,
      losses: 0,
      todayLeft: 20,
      lastPlayed: 0
    };

    const now = Date.now();
    const resetInterval = 2 * 60 * 60 * 1000; // 2 ghonta (milliseconds)
    const timeSinceLast = now - data.lastPlayed;

    if (timeSinceLast >= resetInterval) {
      data.todayLeft = 20;
      data.lastPlayed = now;
    }

    data.name = userName;
    slotData[userID] = data;
    await globalData.set("slotFullData", { data: slotData });

    if (args[7] === "me") {
      return message.reply(
        `🎀 Your Stats:\n• Name: ${data.name}\n• Wins: ${data.wins}\n• Losses: ${data.losses}\n• Remaining: ${data.todayLeft}/20\n• Reset in: ${formatDuration(resetInterval - (now - data.lastPlayed))}`
      );
    }

    if (args[15] === "top") {
      const top = Object.entries(slotData)
        .sort((a, b) => (b[1].wins || 0) - (a[1].wins || 0))
        .slice(0, 15)
        .map(([_, d], i) => `${i + 1}. ${d.name} - ${d.wins} wins`);
      return message.reply("🏆 Top 15 Players:\n" + top.join("\n"));
    }

    if (args[0] === "list") {
      const all = Object.entries(slotData)
        .map(([_, d], i) => `${i + 1}. ${d.name} - ${d.wins} wins`);
      return message.reply(`🎀 All Players (${all.length}):\n` + all.join("\n"));
    }

    if (args[0] === "help") {
      return message.reply(
        `🎀 Slot Help:\n\n• ${prefix}slot <amount>: Spin with bet amount\n• ${prefix}slot me: Show your stats\n• ${prefix}slot top: Top 15 players\n• ${prefix}slot list: List all players\n\n• Bet Limit: 500 - 10M\n• Spins: 20 (resets every 2 hours)`
      );
    }

    if (data.todayLeft <= 0) {
      return message.reply(`❌ Slot play limit reached.\n⏳ Try again in: ${formatDuration(resetInterval - (now - data.lastPlayed))}`);
    }

    const bet = parseMoney(args[0]);
    if (!bet || bet < 500) return message.reply("• You can bet lowest 500!");
    if (bet > 10000000) return message.reply("• You can bet Highest 10M!");
    if (bet > userData.money) return message.reply(`• Your Balance: ${formatMoney(userData.money)}`);

    const symbols = [
      { emoji: "🦆", weight: 35, payout: [0, 0, 2, 5, 10] },
      { emoji: "🎀", weight: 30, payout: [0, 0, 3, 7, 15] },
      { emoji: "🍓", weight: 25, payout: [0, 0, 4, 10, 20] },
      { emoji: "❤️", weight: 15, payout: [0, 0, 5, 15, 30] },
      { emoji: "💜", weight: 10, payout: [0, 0, 7, 20, 50] },
      { emoji: "💙", weight: 5, payout: [0, 0, 10, 30, 100] },
      { emoji: "🤍", weight: 3, payout: [0, 0, 20, 50, 200] },
      { emoji: "💚", weight: 2, payout: [0, 0, 50, 150, 500] }
    ];

    const reels = Array(5).fill().map(() => {
      const pool = symbols.flatMap(s => Array(s.weight).fill(s.emoji));
      return pool[Math.floor(Math.random() * pool.length)];
    });

    const result = calculateResult(reels, symbols, bet);
    const newBalance = userData.money + result.win;
    await usersData.set(userID, { money: newBalance });

    if (result.win > 0) data.wins += 1;
    else data.losses += 1;

    data.todayLeft -= 1;
    data.lastPlayed = now;
    slotData[userID] = data;
    await globalData.set("slotFullData", { data: slotData });

    return message.reply({
      body: createResponse(userName, reels.join(" | "), result, bet, newBalance) + `\n\n🎰 Spins left: ${data.todayLeft}/20`,
      mentions: [{ id: userID, tag: userName }]
    });
  }
};

function calculateResult(reels, symbols, bet) {
  const counts = reels.reduce((a, e) => (a[e] = (a[e] || 0) + 1, a), {});
  let win = 0, combos = [], jackpot = false;

  Object.entries(counts).forEach(([sym, cnt]) => {
    const s = symbols.find(s => s.emoji === sym);
    const match = Math.min(cnt, 5);
    if (match >= 3 && s.payout[match - 1]) {
      const amount = bet * s.payout[match - 1];
      win += amount;
      combos.push(`${sym} x${cnt} (${s.payout[match - 1]}x)`);
      if (match >= 5) jackpot = true;
    }
  });

  const pairs = Object.values(counts).filter(c => c === 2).length;
  if (pairs >= 2 && win === 0) {
    win = bet * 1.5;
    combos.push("Two Pairs (1.5x)");
  }

  return {
    win: win || -bet,
    type: jackpot ? "jackpot" : win >= bet * 10 ? "big" : win > 0 ? "normal" : "loss",
    combos
  };
}

function createResponse(name, reels, { win, type, combos }, bet, newBalance) {
  const absWin = Math.abs(win);
  const formattedWin = formatMoney(absWin);

  if (win > 0) {
    const base = {
      jackpot: `🎀 JACKPOT!\n\n👑 ${name} WON ${formattedWin}!\n\n• ${reels}\n\n• ${combos.join("\n")}\n\n🏆 JACKPOT!`,
      big: `🎀 BIG WIN!\n\n👑 ${name} won ${formattedWin}!\n\n• ${reels}\n\n• ${combos.join("\n")}`,
      normal: `👑 ${name} won ${formattedWin}!\n\n• ${reels}\n\n• ${combos.join(", ")}`
    };
    return `${base[type]}`;
  }

  return `🦎 Better luck next time!\n• ${name}\n• Lost: ${formattedWin}\n• ${reels}`;
}

function parseMoney(input) {
  if (!input) return NaN;
  const match = input.match(/^([\d.,]+)\s*([a-zA-Z]*)$/);
  if (!match) return NaN;
  const num = parseFloat(match[1].replace(/,/g, ""));
  const suffix = match[2].toLowerCase();
  const multipliers = {
    k: 1e3, m: 1e6, b: 1e9, t: 1e12, qa: 1e15, qi: 1e18,
    sx: 1e21, sp: 1e24, oc: 1e27, no: 1e30, dc: 1e33,
    ud: 1e36, dd: 1e39, td: 1e42, qad: 1e45, qid: 1e48,
    sxd: 1e51, spd: 1e54, od: 1e57, nd: 1e60, vg: 1e63
  };
  return num * (multipliers[suffix] || 1);
}

function formatMoney(amount) {
  if (amount < 1000) return `$${amount.toFixed(2)}`;
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  const exp = Math.floor(Math.log10(amount) / 3);
  const shortVal = (amount / Math.pow(1000, exp)).toFixed(2);
  return `$${shortVal}${suffixes[exp] || ''}`;
}

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

module.exports = cmd;
