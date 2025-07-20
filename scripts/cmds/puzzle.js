const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

module.exports = {
  config: {
    name: "puzzle",
    version: "1.1",
    author: "Vex_Kshitiz & Fixed by Yeasin",
    role: 0,
    shortDescription: "Image puzzle game",
    longDescription: "Solve the puzzle by swapping pieces to match the original image.",
    category: "game",
    guide: {
      en: "{p}puzzle (reply to an image)"
    }
  },

  onStart: async function ({ message, event }) {
    const { senderID, messageReply } = event;

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return message.reply("Please reply to an image to start the puzzle game.");
    }

    try {
      const imageUrl = messageReply.attachments[0].url;
      const image = await loadImage(imageUrl);
      const { shuffledParts, originalOrder } = await cropAndShuffleImage(image);

      const initialImageBuffer = await createNumberedImage(shuffledParts, image.width, image.height);
      const initialImagePath = await saveImageToCache(initialImageBuffer);

      const sentMessage = await message.reply({ attachment: fs.createReadStream(initialImagePath) });

      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: "puzzle",
        uid: senderID,
        shuffledParts,
        originalOrder
      });
    } catch (error) {
      console.error("Puzzle Start Error:", error);
      return message.reply("An error occurred while starting the puzzle. Please try again.");
    }
  },

  onReply: async function ({ message, event, args, usersData }) {
    const replyData = global.GoatBot.onReply.get(event.messageReply.messageID);
    if (!replyData || replyData.uid !== event.senderID) return;

    const { shuffledParts, originalOrder, uid } = replyData;

    if (args.length !== 2 || isNaN(args[0]) || isNaN(args[1])) {
      return message.reply("Please provide two valid numbers to swap. Example: `2 5`");
    }

    const part1 = parseInt(args[0]) - 1;
    const part2 = parseInt(args[1]) - 1;

    if (part1 < 0 || part1 >= 8 || part2 < 0 || part2 >= 8) {
      return message.reply("Invalid piece numbers. Please choose numbers between 1 and 8.");
    }

    [shuffledParts[part1], shuffledParts[part2]] = [shuffledParts[part2], shuffledParts[part1]];

    const swappedImageBuffer = await createNumberedImage(shuffledParts, shuffledParts[0].canvas.width * 4, shuffledParts[0].canvas.height * 2);
    const swappedImagePath = await saveImageToCache(swappedImageBuffer);
    const sentMessage = await message.reply({ attachment: fs.createReadStream(swappedImagePath) });

    if (isPuzzleSolved(shuffledParts, originalOrder)) {
      const user = await usersData.get(uid);
      await usersData.set(uid, { money: user.money + 10000 });
      global.GoatBot.onReply.delete(event.messageReply.messageID);
      return message.reply("🎉 Puzzle Solved! You earned 10,000 coins.");
    }

    global.GoatBot.onReply.set(sentMessage.messageID, {
      commandName: "puzzle",
      uid,
      shuffledParts,
      originalOrder
    });
  }
};

async function cropAndShuffleImage(image) {
  const parts = [];
  const originalOrder = [];

  const partWidth = image.width / 4;
  const partHeight = image.height / 2;

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 4; j++) {
      const canvas = createCanvas(partWidth, partHeight);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, j * partWidth, i * partHeight, partWidth, partHeight, 0, 0, partWidth, partHeight);
      parts.push({ canvas, index: i * 4 + j });
      originalOrder.push(i * 4 + j);
    }
  }

  const shuffledParts = shuffle([...parts]);

  return { shuffledParts, originalOrder };
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

async function createNumberedImage(parts, width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const partWidth = width / 4;
  const partHeight = height / 2;

  parts.forEach((part, index) => {
    ctx.drawImage(part.canvas, (index % 4) * partWidth, Math.floor(index / 4) * partHeight);
    ctx.fillStyle = "red";
    ctx.font = "bold 28px Arial";
    ctx.fillText(index + 1, (index % 4) * partWidth + 10, Math.floor(index / 4) * partHeight + 30);
  });

  return canvas.toBuffer();
}

async function saveImageToCache(buffer) {
  const filePath = path.join(cacheDir, `${Date.now()}.png`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function isPuzzleSolved(parts, originalOrder) {
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].index !== originalOrder[i]) return false;
  }
  return true;
}
