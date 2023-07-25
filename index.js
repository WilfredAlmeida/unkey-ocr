const express = require("express");
const fileUpload = require("express-fileupload");
const Tesseract = require("tesseract.js");
const verifyApiKey = require("./middleware");
require("dotenv").config();

const app = express();

app.use(fileUpload());
app.use(express.json());

app.get("/", (_, res) => {
  res.send(`
    <form action='/upload' method='post' encType="multipart/form-data">
      <input type="file" name="sampleFile" />
      <input type='submit' value='Upload!' />
    </form>`);
});

app.post("/upload", [verifyApiKey], async (req, res) => {
  const { sampleFile } = req.files;
  if (!sampleFile) return res.status(400).send("No files were uploaded.");

  const { data, error } = await doOcr(sampleFile.data);

  if (data) return res.status(200).json({ text: data.text, error: null });

  res.status(400).json({ error: error, text: null });
});

app.post("/uploadBase64", [verifyApiKey], async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).send("Image not found.");

  const { data, error } = await doOcr(imageBase64);

  if (data) return res.status(200).json({ text: data.text, error: null });

  res.status(400).json({ error: error, text: null });
});

app.post("/signUp", async (req, res) => {
  const { name = "John Doe", email = "john@example.com" } = req.body;

  // Imaginary name and email validation

  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${process.env.UNKEY_ROOT_KEY}`);
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    apiId: process.env.UNKEY_API_ID,
    prefix: "ocr",
    byteLength: 16,
    ownerId: email,
    meta: {
      name: name,
      email: email,
    },
    expires: 1696870038000,
    ratelimit: {
      type: "fast",
      limit: 1,
      refillRate: 1,
      refillInterval: 10000,
    },
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const createKeyResponse = await fetch(
    "https://api.unkey.dev/v1/keys",
    requestOptions,
  );
  const createKeyResponseJson = await createKeyResponse.json();

  if (createKeyResponseJson.error)
    return res
      .status(400)
      .json({ error: createKeyResponseJson.error, keys: null });

  return res.status(200).json({ keys: [createKeyResponseJson], error: null });
});

const doOcr = async (image) => {
  try {
    const { data } = await Tesseract.recognize(image, "spa+eng", {
      logger: (m) => console.log(m),
    });
    return { data: data, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: error };
  }
};

app.listen(process.env.PORT || 3000, () =>
  console.log("Server started on port 3000"),
);
