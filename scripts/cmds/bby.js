const axios = require('axios');
const baseApiUrl = async () => "https://www.noobs-api.rf.gd/dipto";

module.exports.config = {
  name: "bby",
  aliases: ["baby", "bbe", "bot", "butterfly", "jan"],
  version: "6.9.0",
  author: "dipto",
  countDown: 0,
  role: 0,
  description: "Chatbot with teach, edit, list, react, remove features",
  category: "chat",
  guide: {
    en: `{pn} [message]
→ teach [Message] - [Reply1], [Reply2]...
→ teach react [Message] - [React1], [React2]...
→ edit [Message] - [NewReply]
→ remove [Message]
→ rm [Message] - [Index]
→ msg [Message]
→ list OR list all`
  }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
  const link = `${await baseApiUrl()}/baby`;
  const input = args.join(" ").toLowerCase();
  const uid = event.senderID;

  try {
    if (!args[0]) {
      const replies = ["Bolo baby", "hum", "type help baby", "type !baby hi"];
      return api.sendMessage(replies[Math.floor(Math.random() * replies.length)], event.threadID, event.messageID);
    }

    if (args[0] === 'remove') {
      const key = input.replace("remove ", "");
      const res = await axios.get(`${link}?remove=${encodeURIComponent(key)}&senderID=${uid}`);
      return api.sendMessage(res.data.message, event.threadID, event.messageID);
    }

    if (args[0] === 'rm') {
      if (!input.includes(" - ")) return api.sendMessage("❌ Format: rm [Message] - [Index]", event.threadID, event.messageID);
      const [msg, index] = input.replace("rm ", "").split(" - ");
      const res = await axios.get(`${link}?remove=${encodeURIComponent(msg)}&index=${index}`);
      return api.sendMessage(res.data.message, event.threadID, event.messageID);
    }

    if (args[0] === 'list') {
      const data = (await axios.get(`${link}?list=all`)).data;
      if (args[1] === 'all') {
        const teachers = await Promise.all(
          data.teacher.teacherList.map(async (item) => {
            const id = Object.keys(item)[0];
            const count = item[id];
            const name = (await usersData.get(id)).name;
            return { name, count };
          })
        );
        teachers.sort((a, b) => b.count - a.count);
        const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.count}`).join('\n');
        return api.sendMessage(`Total Teach = ${data.length}\n👑 Teachers:\n${output}`, event.threadID, event.messageID);
      }
      return api.sendMessage(`Total Teach = ${data.length}`, event.threadID, event.messageID);
    }

    if (args[0] === 'msg') {
      const key = input.replace("msg ", "");
      const res = await axios.get(`${link}?list=${encodeURIComponent(key)}`);
      return api.sendMessage(`Message ${key} = ${res.data.data}`, event.threadID, event.messageID);
    }

    if (args[0] === 'edit') {
      if (!input.includes(" - ")) return api.sendMessage("❌ Format: edit [Message] - [NewReply]", event.threadID, event.messageID);
      const [oldMsg, newMsg] = input.replace("edit ", "").split(" - ");
      const res = await axios.get(`${link}?edit=${encodeURIComponent(oldMsg)}&replace=${encodeURIComponent(newMsg)}&senderID=${uid}`);
      return api.sendMessage(`✅ Changed: ${res.data.message}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] !== 'react' && args[1] !== 'amar') {
      if (!input.includes(" - ")) return api.sendMessage("❌ Format: teach [Message] - [Replies]", event.threadID, event.messageID);
      const [msg, replies] = input.replace("teach ", "").split(" - ");
      const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&reply=${encodeURIComponent(replies)}&senderID=${uid}`);
      const teacher = (await usersData.get(res.data.teacher)).name;
      return api.sendMessage(`✅ Replies added: ${res.data.message}\n👤 Teacher: ${teacher}\n📚 Total: ${res.data.teachs}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'amar') {
      const [msg, replies] = input.replace("teach ", "").split(" - ");
      if (!replies) return api.sendMessage("❌ Format: teach amar [Message] - [Replies]", event.threadID, event.messageID);
      const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&reply=${encodeURIComponent(replies)}&key=intro&senderID=${uid}`);
      return api.sendMessage(`✅ Replies added: ${res.data.message}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'react') {
      const [msg, reacts] = input.replace("teach react ", "").split(" - ");
      if (!reacts) return api.sendMessage("❌ Format: teach react [Message] - [Reactions]", event.threadID, event.messageID);
      const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&react=${encodeURIComponent(reacts)}`);
      return api.sendMessage(`✅ Reacts added: ${res.data.message}`, event.threadID, event.messageID);
    }

    if (
      input.includes('amar name ki') ||
      input.includes('amr nam ki') ||
      input.includes('whats my name')
    ) {
      const res = await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`);
      return api.sendMessage(res.data.reply, event.threadID, event.messageID);
    }

    const res = await axios.get(`${link}?text=${encodeURIComponent(input)}&senderID=${uid}&font=1`);
    return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
      if (info?.messageID) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: uid
        });
      }
    }, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ An error occurred. Please try again later.", event.threadID, event.messageID);
  }
};

module.exports.onReply = async ({ api, event }) => {
  try {
    const text = event.body?.toLowerCase() || "";
    const res = await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(text)}&senderID=${event.senderID}&font=1`);
    return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
      if (info?.messageID) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID
        });
      }
    }, event.messageID);
  } catch (err) {
    return api.sendMessage(`❌ Reply Error: ${err.message}`, event.threadID, event.messageID);
  }
};

module.exports.onChat = async ({ api, event }) => {
  try {
    const body = event.body?.toLowerCase() || "";
    const triggers = ["baby", "bby", "বেবি", "bot", "butterfly", "babu", "jan"];
    const isTriggered = triggers.some(prefix => body.startsWith(prefix));

    if (isTriggered) {
      const msg = body.replace(/^\S+\s*/, "");
      const greetings = ["𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐚𝐥𝐚𝐢𝐤𝐮𝐦", "𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐚𝐥𝐚𝐢𝐤𝐮𝐦", "𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐚𝐥𝐚𝐢𝐤𝐮𝐦", "𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐚𝐥𝐚𝐢𝐤𝐮𝐦", "𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐚𝐥𝐚𝐢𝐤𝐮𝐦"];
      if (!msg) {
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        return api.sendMessage(greeting, event.threadID, (err, info) => {
          if (info?.messageID) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: module.exports.config.name,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID
            });
          }
        }, event.messageID);
      }
      const res = await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(msg)}&senderID=${event.senderID}&font=1`);
      return api.sendMessage(res.data.reply, event.threadID, (err, info) => {
        if (info?.messageID) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        }
      }, event.messageID);
    }

  } catch (err) {
    return api.sendMessage(`❌ Chat Error: ${err.message}`, event.threadID, event.messageID);
  }
};
