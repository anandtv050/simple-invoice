const fs = require("fs");
const axios = require("axios");
const stringSimilarity = require("string-similarity");

const ASSEMBLYAI_API_KEY = "43e2a151dbfd4b8ba3c501c841e74835";

exports.transcribeAudio = async (audioPath) => {
  console.log("auduipath", audioPath);

  const audioData = fs.readFileSync(audioPath);
  console.log("audiodata", audioData);

  // Upload audio file to AssemblyAI
  const uploadResponse = await axios({
    method: "post",
    url: "https://api.assemblyai.com/v2/upload",
    data: audioData,
    timeout: 10000,
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      "transfer-encoding": "chunked",
    },
  });

  const uploadUrl = uploadResponse.data.upload_url;

  // Start transcription
  const transcriptResponse = await axios({
    method: "post",
    url: "https://api.assemblyai.com/v2/transcript",
    data: {
      audio_url: uploadUrl,
      language_code: "en_us",
    },
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
    },
  });

  const transcriptId = transcriptResponse.data.id;

  // Poll for transcript completion
  while (true) {
    const pollingResponse = await axios({
      method: "get",
      url: `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      headers: { authorization: ASSEMBLYAI_API_KEY },
    });

    const status = pollingResponse.data.status;
    if (status === "completed") {
      return pollingResponse.data.text;
    } else if (status === "error") {
      throw new Error("Transcription failed");
    }
    // wait before next poll
    await new Promise((r) => setTimeout(r, 3000));
  }
};

exports.extractVoiceData = async (text) => {
  const commandMap = [
    {
      intent: "CREATE_INVOICE",
      keyWords: [ "create invoice","make invoice","new invoice","generate invoice",],
      action: () => "createinvoice",
    },
    {
      intent: "EDIT_INVOICE",
      keyWords: ["edit invoice", "make invoice", "change inoice"],
      action: () => "editinvoice",
    },
     {
      intent: "EXPORT_CSV",
      keyWords: ["export csv", "generate csv", "download csv", "csv file", "save as csv","csv"],
      action: () => "exportcsv",
    },
    {
      intent: "EXPORT_EXCEL",
      keyWords: ["export excel", "generate excel", "download excel", "excel file", "save as excel","excel"],
      action: () => "exportexcel",
    },
    {
      intent: "PRINT_INVOICE",
      keyWords: ["print invoice", "print bill", "take print", "hard copy","pdf"],
      action: () => "printinvoice",
    },
  ];

  // function detectCommand(strText){
  const strLowerText = text.toLowerCase();
  for (const cmd of commandMap) {
    const { bestMatch } = stringSimilarity.findBestMatch(strLowerText,cmd.keyWords);
    if (bestMatch.rating > 0.5) {
      return cmd.action();
    }
  }
  return "unknowncommand";
};
