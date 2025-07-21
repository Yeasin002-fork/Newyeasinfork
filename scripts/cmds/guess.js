function formatMoney(num) {
	const units = ["", "K", "M", "B", "T"];
	let unit = 0;
	while (num >= 1000 && ++unit < units.length) num /= 1000;
	return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}

module.exports = {
	config: {
		name: "guess",
		version: "1.1",
		author: "Dipto + Modified by Yeasin",
		countDown: 5,
		role: 0,
		limit: 10,
		description: {
			en: "Simple emoji guessing game"
		},
		category: "game",
		guide: {
			en: "{pn} <amount>: Start a guessing game by betting an amount"
		}
	},

	langs: {
		en: {
			invalidAmount: "❌ | Please enter a valid bet amount (minimum $100)",
			maxBet: "❌ | Maximum bet is $10,000,000 (10M)",
			gameStarted: "🎯 | Choose one emoji by replying with 1, 2, or 3:",
			win: "🎉 | Correct guess!\n💎 | Winning emoji: %1\n💰 | You won: %2 x4 = %3!",
			lose: "😔 | Wrong guess.\n💎 | Winning emoji: %1 (%3)\n💸 | You lost: %2.",
			invalidChoice: "❌ | Reply with 1, 2, or 3 to choose an emoji!",
			notYourGame: "❌ | This is not your game!"
		}
	},

	onStart: async function ({ message, event, args, getLang, commandName }) {
		const { senderID } = event;
		const betAmount = parseInt(args[0]);

		if (!betAmount || betAmount < 100)
			return message.reply(getLang("invalidAmount"));
		if (betAmount > 10000000)
			return message.reply(getLang("maxBet"));

		const emojis = [
			"💎", "🎰", "🍀", "⭐", "🔥", "💰", "🎯", "🏆", "👑", "🌟"
		];

		const gameEmojis = [];
		for (let i = 0; i < 3; i++) {
			const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
			gameEmojis.push(randomEmoji);
		}

		const winningPosition = Math.floor(Math.random() * 3) + 1;

		message.reply(`${getLang("gameStarted")}\n\n               ${gameEmojis[0]}          ${gameEmojis[1]}          ${gameEmojis[2]}`, (err, info) => {
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				author: senderID,
				betAmount,
				emojis: gameEmojis,
				winningPosition,
				winningEmoji: gameEmojis[winningPosition - 1]
			});
		});
	},

	onReply: async function ({ message, event, Reply, getLang, usersData }) {
		const { senderID } = event;
		const { author, betAmount, emojis, winningPosition, winningEmoji, messageID } = Reply;

		if (senderID !== author)
			return message.reply(getLang("notYourGame"));

		const userChoice = parseInt(event.body.trim());
		if (!userChoice || userChoice < 1 || userChoice > 3)
			return message.reply(getLang("invalidChoice"));

		global.GoatBot.onReply.delete(messageID);
		await message.unsend(messageID);

		if (!global.guessStats) global.guessStats = {};
		if (!global.guessStats[senderID]) {
			global.guessStats[senderID] = {
				totalPlays: 0,
				winCount: 0
			};
		}
		global.guessStats[senderID].totalPlays++;

		const userData = await usersData.get(senderID);
		const userName = userData?.name || "User";
		const tagData = { tag: `👑 ${userName}`, id: senderID };

		let resultMessage = "";
		if (userChoice === winningPosition) {
			global.guessStats[senderID].winCount++;
			const winAmount = betAmount * 4;
			resultMessage = getLang("win", winningEmoji, formatMoney(betAmount), formatMoney(winAmount));
		} else {
			resultMessage = getLang("lose", winningEmoji, formatMoney(betAmount), winningPosition);
		}

		const stats = global.guessStats[senderID];
		resultMessage = `👑 ${userName},\n${resultMessage}\n\n🕹️ You won ${stats.winCount}/${stats.totalPlays} times`;

		return message.reply({
			body: resultMessage,
			mentions: [tagData]
		});
	}
};
