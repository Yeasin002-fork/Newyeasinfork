module.exports = {
  config: {
    name: "pending",
    version: "1.0",
    author: "MIKI",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "",
      en: ""
    },
    longDescription: {
      vi: "",
      en: ""
    },
    category: "Goat-alAuthor"
  },

  langs: {
    en: {
      invalidNumber: "❌ %1 is not a valid number!",
      cancelSuccess: "❌ Refused %1 thread(s)!",
      approveSuccess: "✅ Approved successfully %1 thread(s)! 🎀",
      cantGetPendingList: "⚠️ Can't get the pending list!",
      returnListPending: "📋 »「PENDING」«❮ Total pending threads: %1 ❯\n\n%2",
      returnListClean: "✅ 「PENDING」 There is no thread in the pending list"
    }
  },

  onReply: async function({ api, event, Reply, getLang, commandName, prefix }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    const { body, threadID, messageID } = event;
    let count = 0;

    const lowerBody = body.toLowerCase();

    if (isNaN(body) && (lowerBody.startsWith("c") || lowerBody.startsWith("cancel"))) {
      // Cancel / refuse threads
      const index = body.slice(body.indexOf(" ") + 1).split(/\s+/);
      for (const singleIndex of index) {
        if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > Reply.pending.length) {
          return api.sendMessage(getLang("invalidNumber", singleIndex), threadID, messageID);
        }
        await api.removeUserFromGroup(api.getCurrentUserID(), Reply.pending[singleIndex - 1].threadID);
        count++;
      }
      return api.sendMessage(getLang("cancelSuccess", count), threadID, messageID);
    } else {
      // Approve threads
      const index = body.split(/\s+/);
      for (const singleIndex of index) {
        if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > Reply.pending.length) {
          return api.sendMessage(getLang("invalidNumber", singleIndex), threadID, messageID);
        }
        await api.sendMessage(
          `✨ 𝐀𝐒𝐒𝐀𝐋𝐀𝐌𝐔𝐀𝐋𝐀𝐈𝐊𝐔𝐌 ☔︎\n` +
          `🌟 𝚃𝙷𝙸𝚂 𝙸𝚂 𝙔𝙴𝙰𝚂𝙸𝙽 𝗯𝗼𝘁 ❤︎\n` +
          `🔗 𝙼𝚈 𝙾𝚆𝙽𝙴𝚁 𝙸𝙳: https://www.facebook.com/profile.php?id=61552257412748\n\n` +
          `🎀 𝗧𝗵𝗶𝘀 𝗯𝗼𝘅 𝗽𝗿𝗲𝗺𝗶𝘀𝘀𝗶𝗼𝗻 𝘀𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹 🎀\n\n` +
          `• 💡 Use ${prefix}𝗵𝗲𝗹𝗽 to see all commands\n` +
          `• 💖 Have a nice 𝐘𝐎𝐔𝐑 𝐆𝐑𝐎𝐔𝐏`,
          Reply.pending[singleIndex - 1].threadID
        );
        count++;
      }
      return api.sendMessage(getLang("approveSuccess", count), threadID, messageID);
    }
  },

  onStart: async function({ api, event, getLang, commandName }) {
    const { threadID, messageID } = event;

    let msg = "", index = 1;

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

      for (const single of list) {
        msg += `🎀🎊 ${index++}. ${single.name} (ID: ${single.threadID})\n`;
      }

      if (list.length != 0) {
        return api.sendMessage(getLang("returnListPending", list.length, msg), threadID, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
          });
        }, messageID);
      } else {
        return api.sendMessage(getLang("returnListClean"), threadID, messageID);
      }
    } catch (e) {
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }
  }
};
