const fs = require("fs");
const path = require("path");
var db = require("../config/db");
var aiService = require("../Services/AiVoiceService");

exports.processVoice = async (req, res) => {
  const audioPath = req.file.path;

  try {
    const text = await aiService.transcribeAudio(audioPath);
    console.log("texttt",text);
    
    const objAction = await aiService.extractVoiceData(text);
console.log(objAction);

    res.json(objAction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process audio" });
  } finally {
    fs.unlink(audioPath, () => {}); // Clean up audio file
  }
};
