const axios = require("axios");

module.exports.config = {
  name: "bkash",
  version: "1.0",
  author: "Gok & Yeasin",
  description: "Create a fake Bkash screenshot with auto-generated TXN ID",
  usePrefix: true,
  prefix: true,
  role: 0,
  category: "Fun",
  guide: {
    en: "<number> - <amount>\nExample: bkashf 01******** - 1000"
  },
  cooldowns: 5
};

function generateTransactionID() {
  return `TXN${Math.floor(1000000 + Math.random() * 9000000)}`;
}

module.exports.onStart = async function ({ api, event, args }) {
  const input = args.join(" ");

  // No input: show help
  if (!input) {
    return api.sendMessage(
      `📲 Fake bKash Screenshot Generator\n\n👉 Format:\n<Phone Number> - <Amount>\n\n🧾 Example:\nbkashf 01******** - 1000\n\n🔁 Transaction ID will be generated automatically.`,
      event.threadID,
      event.messageID
    );
  }

  // Format error
  if (!input.includes("-")) {
    return api.sendMessage(
      `❌ Wrong format!\n✅ Example: bkashf 01******** - 1000`,
      event.threadID,
      event.messageID
    );
  }

  const [numberRaw, amountRaw] = input.split("-");
  const number = numberRaw?.trim();
  const amount = amountRaw?.trim();

  // Input validation
  if (!number || !amount || isNaN(amount)) {
    return api.sendMessage(
      `⚠️ Invalid input!\nExample: bkashf 01******** - 1000`,
      event.threadID,
      event.messageID
    );
  }

  const transaction = generateTransactionID();
  const url = `https://masterapi.site/api/bkashf.php?number=${encodeURIComponent(number)}&transaction=${encodeURIComponent(transaction)}&amount=${encodeURIComponent(amount)}`;

  // Generating message
  api.sendMessage("🛠️ Generating fake screenshot, please wait...", event.threadID, (err, info) => {
    setTimeout(() => {
      api.unsendMessage(info.messageID);
    }, 4000);
  });

  try {
    const response = await axios.get(url, { responseType: "stream" });
    const imageStream = response.data;

    api.sendMessage(
      {
        body: `━━━━━━━━━━━━━━━━━━━━━━━\n📱 Number: ${number}\n🧾 Transaction ID: ${transaction}\n💵 Amount: ৳${amount}\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ Powered by Yeasin`,
        attachment: imageStream
      },
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.log("❌ Error:", err.message);
    return api.sendMessage("❌ Failed to generate screenshot. API may be down.", event.threadID, event.messageID);
  }
};
