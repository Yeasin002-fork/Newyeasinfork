module.exports = {
 config: {
  name: "spin",
  version: "4.1",
  author: "XNIL + Modified by Yeasin",
  countDown: 5,
  role: 0,
  description: "Spin and win/loss money. 2hr = 30 spins. Msg unsent disabled.",
  category: "game",
  guide: {
   en: "{p}spin <amount>\n{p}spin top"
  }
 },

 onStart: async function ({ message, event, args, usersData, api }) {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const subCommand = args[0];

  // ✅ /spin top leaderboard
  if (subCommand === "top") {
   const allUsers = await usersData.getAll();

   const top = allUsers
    .filter(u => typeof u.data?.totalSpinWin === "number" && u.data.totalSpinWin > 0)
    .sort((a, b) => b.data.totalSpinWin - a.data.totalSpinWin)
    .slice(0, 10);

   if (top.length === 0) {
    const msg = await message.reply("❌ No spin winners yet.");
    return;
   }

   const result = top.map((user, i) => {
    const name = user.name || `User ${user.userID?.slice(-4) || "??"}`;
    return `${i + 1}. ${name} – 💸 ${user.data.totalSpinWin} coins`;
   }).join("\n");

   await message.reply(`🏆 Top Spin Winners:\n\n${result}`);
   return;
  }

  // ✅ /spin <amount>
  const betAmount = parseInt(subCommand);
  if (isNaN(betAmount) || betAmount <= 0) {
   const msg = await message.reply("❌ Usage:\n/spin <amount>\n/spin top");
   return;
  }

  const userData = await usersData.get(senderID) || {};
  userData.money = userData.money || 0;
  userData.data = userData.data || {};
  userData.data.totalSpinWin = userData.data.totalSpinWin || 0;
  userData.data.spinHistory = userData.data.spinHistory || [];

  const now = Date.now();
  const twoHours = 2 * 60 * 60 * 1000;  // 2 ghonta in milliseconds

  // ✅ Remove old spin timestamps older than 2 hours
  userData.data.spinHistory = userData.data.spinHistory.filter(ts => now - ts < twoHours);

  if (userData.data.spinHistory.length >= 30) {
   const nextReset = new Date(userData.data.spinHistory[0] + twoHours);
   const timeLeft = nextReset - now;

   const h = Math.floor(timeLeft / 3600000);
   const m = Math.floor((timeLeft % 3600000) / 60000);
   const s = Math.floor((timeLeft % 60000) / 1000);

   const msg = await message.reply(
    `❌ Spin limit reached (30 spins/2h).\n⏳ Try again in ${h}h ${m}m ${s}s.`
   );
   return;
  }

  if (userData.money < betAmount) {
   const msg = await message.reply(`❌ Not enough money.\n💰 Your balance: ${userData.money}`);
   return;
  }

  // ✅ Bet deduct
  userData.money -= betAmount;

  const outcomes = [
   { text: "💥 You lost everything!", multiplier: 0 },
   { text: "😞 You got back half.", multiplier: 0.5 },
   { text: "🟡 You broke even.", multiplier: 1 },
   { text: "🟢 You doubled your money!", multiplier: 2 },
   { text: "🔥 You tripled your bet!", multiplier: 3 },
   { text: "🎉 JACKPOT! 10x reward!", multiplier: 10 }
  ];

  const result = outcomes[Math.floor(Math.random() * outcomes.length)];
  const reward = Math.floor(betAmount * result.multiplier);
  userData.money += reward;

  if (reward > betAmount) {
   const profit = reward - betAmount;
   userData.data.totalSpinWin += profit;
  }

  userData.data.spinHistory.push(now);
  await usersData.set(senderID, userData);

  // Get user name for mention text
  const userName = (await api.getUserInfo(senderID))[senderID]?.name || "Player";

  // Prepare mention object without '@' in text, but mention notify will work
  const mentions = [{ id: senderID, tag: userName }];

  // Add crown emoji before mention tag in message body
  const messageBody =
   `‎👑 ${userName} spun the wheel!\n` +
   `${result.text}\n` +
   `🎰 You bet: ${betAmount}$\n` +
   `💸 You won: ${reward}$\n` +
   `💰 New balance: ${userData.money}$\n` +
   `🔁 Spins left: ${30 - userData.data.spinHistory.length}/30`;

  await api.sendMessage({ body: messageBody, mentions }, threadID);
 }
};
