const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.album;
};

module.exports = { 
  config: { 
    name: "album", 
    version: "1.7", 
    role: 0, 
    author: "Yeasin", 
    category: "media", 
    guide: { 
      en: "{p}{n} [page number] (e.g., {p}{n} 2 to view the next page)\n{p}{n} add [category] [URL] - Add a video to a category\n{p}{n} list - View total videos in each category",
    }, 
  },

  onStart: async function ({ api, event, args }) { 
    const apiUrl = await baseApiUrl();

    if (args[0] === "add") {
      if (!args[1]) {
        return api.sendMessage("❌ Please specify a category. Usage: !a add [category]", event.threadID, event.messageID);
      }

      const category = args[1].toLowerCase();

      if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        const attachment = event.messageReply.attachments[0];
        
        if (attachment.type !== "video") {
          return api.sendMessage("❌ Only video attachments are allowed.", event.threadID, event.messageID);
        }

        try {
          const response = await axios.post(
            "https://api.imgur.com/3/image",
            {
              image: attachment.url,
              type: "url"
            },
            {
              headers: {
                Authorization: "Client-ID 137256035dcfdcc"
              }
            }
          );

          const imgurLink = response.data?.data?.link;
          if (!imgurLink) throw new Error("Imgur upload failed");

          try {
            const uploadResponse = await axios.post(`${apiUrl}/album/add`, {
              category,
              videoUrl: imgurLink,
            });

            return api.sendMessage(uploadResponse.data.message, event.threadID, event.messageID);
          } catch (error) {
            return api.sendMessage(`${error.response?.data?.error || error.message}`, event.threadID, event.messageID);
          }

        } catch (error) {
          return api.sendMessage(`${error.message}`, event.threadID, event.messageID);
        }
      }

      if (!args[2]) {
        return api.sendMessage("❌ Please provide a video URL or reply to a video message.", event.threadID, event.messageID);
      }

      const videoUrl = args[2];
      try {
        const response = await axios.post(`${apiUrl}/album/add`, {
          category,
          videoUrl,
        });

        return api.sendMessage(response.data.message, event.threadID, event.messageID);
      } catch (error) {
        return api.sendMessage(`${error.response?.data?.error || error.message}`, event.threadID, event.messageID);
      }

    } else if (args[0] === "list") {
      try {
      const response = await axios.get(`${apiUrl}/album/list`);
      api.sendMessage(response.data.message, event.threadID, event.messageID);
     } catch (error) {
      api.sendMessage(`${error.message}`, event.threadID, event.messageID);
      }
    } else {
      const displayNames = ["𝐅𝐮𝐧𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐈𝐬𝐥𝐚𝐦𝐢𝐜 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐒𝐚𝐝 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐀𝐧𝐢𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐋𝐨𝐅𝐈 𝐕𝐢𝐝𝐞𝐨 🎀",
       "𝐀𝐭𝐭𝐢𝐭𝐮𝐝𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐇𝐨𝐫𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐂𝐨𝐮𝐩𝐥𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐅𝐥𝐨𝐰𝐞𝐫 𝐕𝐢𝐝𝐞𝐨🎀", "𝐁𝐢𝐤𝐞 & 𝐂𝐚𝐫 𝐕𝐢𝐝𝐞𝐨 🎀",
       "𝐋𝐨𝐯𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐋𝐲𝐫𝐢𝐜𝐬 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐂𝐚𝐭 𝐕𝐢𝐝𝐞𝐨 🎀", "𝟏𝟖+ 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐅𝐫𝐞𝐞 𝐅𝐢𝐫𝐞 𝐕𝐢𝐝𝐞𝐨 🎀",
       "𝐅𝐨𝐨𝐭𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐁𝐚𝐛𝐲 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐅𝐫𝐢𝐞𝐧𝐝𝐬 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐏𝐮𝐛𝐠 𝐯𝐢𝐝𝐞𝐨 🎀", "𝐀𝐞𝐬𝐭𝐡𝐞𝐭𝐢𝐜 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐍𝐚𝐫𝐮𝐭𝐨 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐃𝐫𝐚𝐠𝐨𝐧 𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐁𝐥𝐞𝐚𝐜𝐡 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐃𝐞𝐦𝐨𝐧 𝐬𝐲𝐥𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐉𝐮𝐣𝐮𝐭𝐬𝐮 𝐊𝐚𝐢𝐬𝐞𝐧 𝐯𝐢𝐝𝐞𝐨 🎀", "𝐒𝐨𝐥𝐨 𝐥𝐞𝐯𝐞𝐥𝐢𝐧𝐠 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐓𝐨𝐤𝐲𝐨 𝐫𝐞𝐯𝐞𝐧𝐠𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐁𝐥𝐮𝐞 𝐥𝐨𝐜𝐤 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐂𝐡𝐚𝐢𝐧𝐬𝐚𝐰 𝐦𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐃𝐞𝐚𝐭𝐡 𝐧𝐨𝐭𝐞 𝐯𝐢𝐝𝐞𝐨 🎀", "𝐎𝐧𝐞 𝐏𝐢𝐞𝐜𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐀𝐭𝐭𝐚𝐜𝐤 𝐨𝐧 𝐓𝐢𝐭𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐒𝐚𝐤𝐚𝐦𝐨𝐭𝐨 𝐃𝐚𝐲𝐬 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐰𝐢𝐧𝐝 𝐛𝐫𝐞𝐚𝐤𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐎𝐧𝐞 𝐩𝐮𝐧𝐜𝐡 𝐦𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐀𝐥𝐲𝐚 𝐑𝐮𝐬𝐬𝐢𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐁𝐥𝐮𝐞 𝐛𝐨𝐱 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐇𝐮𝐧𝐭𝐞𝐫 𝐱 𝐇𝐮𝐧𝐭𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐋𝐨𝐧𝐞𝐫 𝐥𝐢𝐟𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐇𝐚𝐧𝐢𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 🎀"
    ];    
      const itemsPerPage = 10;
      const page = parseInt(args[0]) || 1;
      const totalPages = Math.ceil(displayNames.length / itemsPerPage);

      if (page < 1 || page > totalPages) {
        return api.sendMessage(`❌ Invalid page! Please choose between 1 - ${totalPages}.`, event.threadID, event.messageID);
      }

      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage
