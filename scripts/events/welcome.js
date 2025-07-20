const _0x2dc0c4 = require("fs-extra");
const _0x1e7b41 = require("path");
const _0x54ff74 = require("canvas");
const _0x4f2c2a = require("axios");
const _0x4fce71 = require("moment-timezone");
const _0x4641ea = require("crypto");

module["exports"] = {
  "config": {
    "name": "welcome",
    "version": "2.0",
    "author": "𝐄𝐰'𝐫 𝐒𝐚𝐢𝐦",
    "category": "events"
  },

  "onStart": async function ({ event, api, threadsData }) {
    if (event["logMessageType"] !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData["addedParticipants"];
    const botID = api["getCurrentUserID"]();

    if (newUsers["some"](user => user["userFbId"] === botID)) return;

    const threadInfo = await api["getThreadInfo"](threadID);
    const groupName = threadInfo["threadName"];
    const memberCount = threadInfo["participantIDs"]["length"];

    for (const user of newUsers) {
      const userId = user["userFbId"];
      const fullName = user["fullName"];

      const tmpDir = _0x1e7b41["join"](__dirname, "cache");
      _0x2dc0c4["ensureDirSync"](tmpDir);

      const avatarURL = `https://graph.facebook.com/${userId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarPath = _0x1e7b41["join"](tmpDir, `avt_${userId}.png`);
      const outputPath = _0x1e7b41["join"](tmpDir, `welcome_card_${userId}.png`);

      try {
        const res = await _0x4f2c2a["get"](avatarURL, { "responseType": "arraybuffer" });
        _0x2dc0c4["writeFileSync"](avatarPath, Buffer["from"](res["data"], "utf-8"));

        const avatar = await (0, _0x54ff74["loadImage"])(avatarPath);
        const W = 983, H = 480;
        const canvas = (0, _0x54ff74["createCanvas"])(W, H);
        const ctx = canvas["getContext"]("2d");

        const gradient = ctx["createLinearGradient"](0, 0, W, H);
        gradient["addColorStop"](0, "#000d1a");
        gradient["addColorStop"](1, "#001f33");
        ctx["fillStyle"] = gradient;
        ctx["fillRect"](0, 0, W, H);

        const avatarSize = 180;
        const ax = (W - avatarSize) / 2;
        const ay = 40;
        const r = avatarSize / 2;

        for (let i = 4; i >= 0; i--) {
          ctx["beginPath"]();
          ctx["arc"](ax + r, ay + r, r + i * 4, 0, Math["PI"] * 2);
          const glowColor = ["#00ffff", "#00ccff", "#0099cc", "#005577"][i] || "#ffffff";
          ctx["strokeStyle"] = glowColor;
          ctx["lineWidth"] = 2;
          ctx["shadowColor"] = glowColor;
          ctx["shadowBlur"] = 20 + i * 4;
          ctx["stroke"]();
        }

        ctx["save"]();
        ctx["beginPath"]();
        ctx["arc"](ax + r, ay + r, r, 0, Math["PI"] * 2);
        ctx["clip"]();
        ctx["drawImage"](avatar, ax, ay, avatarSize, avatarSize);
        ctx["restore"]();

        ctx["textAlign"] = "center";
        ctx["font"] = "bold 42px Arial";
        ctx["fillStyle"] = "#00ffff";
        ctx["shadowColor"] = "#00ccff";
        ctx["shadowBlur"] = 25;
        ctx["fillText"](`Hello ${fullName}`, W / 2, 280);

        ctx["font"] = "bold 34px Arial";
        ctx["fillStyle"] = "#ff99cc";
        ctx["shadowColor"] = "#cc6699";
        ctx["shadowBlur"] = 20;
        ctx["fillText"](`Welcome to ${groupName}`, W / 2, 330);

        ctx["font"] = "30px Arial";
        ctx["fillStyle"] = "#ffff99";
        ctx["shadowColor"] = "#cccc66";
        ctx["shadowBlur"] = 20;
        ctx["fillText"](`You're the ${memberCount} member on this group please enjoy`, W / 2, 375);

        ctx["font"] = "28px monospace";
        ctx["fillStyle"] = "#bbbbbb";
        ctx["shadowBlur"] = 0;
        ctx["fillText"]("━━━━━━━━━━━━━━━━", W / 2, 415);

        const timeStr = _0x4fce71()["tz"]("Asia/Dhaka")["format"]("[📅] hh:mm:ss A - DD/MM/YYYY - dddd");
        ctx["font"] = "20px Arial";
        ctx["fillStyle"] = "#aaaaaa";
        ctx["shadowBlur"] = 0;
        ctx["fillText"](timeStr, W / 2, 455);

        _0x2dc0c4["writeFileSync"](outputPath, canvas["toBuffer"]("image/png"));

        const messageText = `Hello ${fullName}\nWelcome to ${groupName}\nYou're the ${memberCount} member on this group please enjoy\n━━━━━━━━━━━━━━━━\n${timeStr}`;

        await api["sendMessage"]({
          "body": messageText,
          "attachment": _0x2dc0c4["createReadStream"](outputPath),
          "mentions": [{ "tag": fullName, "id": userId }]
        }, threadID);

        _0x2dc0c4["unlinkSync"](avatarPath);
        setTimeout(() => _0x2dc0c4["unlink"](outputPath)["catch"](() => { }), 60000);

      } catch (err) {
        console["error"]("⚠️ Error generating welcome image:", err);
      }
    }
  }
};
