module.exports = {
  config: {
    name: "listbox",
    version: "1.0",
    author: "Yeasin",
    countDown: 5,
    role: 2,
    shortDescription: "Show members with emoji and UID",
    longDescription: "Lists group members with gender-based emojis and UID",
    category: "box chat",
    guide: "{p}listbox"
  },

  onStart: async function ({ api, event }) {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const members = threadInfo.userInfo;

    let msg = "👥 Members List:\n";

    for (const user of members) {
      const name = user.name;
      const uid = user.id;
      const gender = user.gender;
      let emoji;

      if (gender === 'FEMALE') emoji = "🙋‍♀️";
      else if (gender === 'MALE') emoji = "🙋‍♂️";
      else emoji = "🤡";

      msg += `• ${emoji} ${name} (UID: ${uid})\n`;
    }

    api.sendMessage(msg, event.threadID);
  }
};
