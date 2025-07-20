const axios = require("axios");

module.exports.config = {
  name: "nagad",
  version: "1.3",
  role: 0,
  author: "Yeasin",
  description: "Fake Nagad screenshot with realistic charge calculation",
  usePrefix: true,
  prefix: true,
  category: "Fun",
  guide: "<number> - <total amount>\nExample: nagadf 01******** - 5100",
  cooldowns: 5,
};

function generateTransactionID() {
  return `TXN${Math.floor(1000000 + Math.random() * 9000000)}`;
}

module.exports.onStart = async function ({ api, event, args }) {
  const input = args.join(" ");

  if (!input) {
    return api.sendMessage(
      `📲 Fake Nagad Screenshot Generator\n\n👉 Format:\n<number> - <total amount>\n\n🧾 Example:\nnagadf 01******** - 5100\n\n🔁 Transaction ID and charge calculated automatically.`,
      event.threadID,
      event.messageID
    );
  }

  if (!input.includes("-")) {
    return api.sendMessage(
      `❌ Wrong format!\n✅ Use like: nagadf 01******** - 5100`,
      event.threadID,
      event.messageID
    );
  }

  const [numberRaw, totalRaw] = input.split("-");
  const number = numberRaw.trim();
  const totalAmount = parseFloat(totalRaw.trim());

  if (!number || isNaN(totalAmount)) {
    return api.sendMessage(
      `⚠️ Invalid input!\nExample: nagadf 01******** - 5100`,
      event.threadID,
      event.messageID
    );
  }

  // Realistic Nagad charge calculation
  // Charge = 1.5% of amount + 2 Taka fixed
  // total = amount + charge
  // => amount = (total - fixed_charge) / (1 + percentage)

  const fixedCharge = 2; // Fixed charge in Taka
  const percentageCharge = 0.015; // 1.5%

  const amount = (totalAmount - fixedCharge) / (1 + percentageCharge);
  const charge = totalAmount - amount;

  // Round 2 decimals
  const amountFixed = amount.toFixed(2);
  const chargeFixed = charge.toFixed(2);
  const totalFixed = totalAmount.toFixed(2);

  const transaction = generateTransactionID();

  const url = `https://masterapi.site/api/nagadf.php?number=${encodeURIComponent(
    number
  )}&transaction=${encodeURIComponent(transaction)}&amount=${encodeURIComponent(
    amountFixed
  )}&charge=${encodeURIComponent(chargeFixed)}&total=${encodeURIComponent(totalFixed)}`;

  api.sendMessage(
    `📤 Generating... please wait... ⏳`,
    event.threadID,
    (err, info) => {
      setTimeout(() => {
        api.unsendMessage(info.messageID);
      }, 4000);
    }
  );

  try {
    const response = await axios.get(url, { responseType: "stream" });
    const attachment = response.data;

    api.sendMessage(
      {
        body: `━━━━━━━━━━━━━━━━━━━━━━━
📱 Number: ${number}
🧾 Transaction ID: ${transaction}
💵 Amount: ৳${amountFixed}
💸 Charge: ৳${chargeFixed}
💰 Total: ৳${totalFixed}

━━━━━━━━━━━━━━━━━━━━━━━
✅ Ready for Nagad SS
━━━━━━━━━━━━━━━━━━━━━━━
💥 Powered by Yeasin
━━━━━━━━━━━━━━━━━━━━━━━`,
        attachment,
      },
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.error("Error in nagadf command:", err.message);
    api.sendMessage(
      "❌ An error occurred while generating the screenshot. Try again later.",
      event.threadID,
      event.messageID
    );
  }
};
