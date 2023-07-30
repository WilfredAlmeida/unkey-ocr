import express, { Request, Response } from "express";
import fileUpload from "express-fileupload";
import Tesseract from "tesseract.js";
import verifyApiKey from "./middleware.ts";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(fileUpload());
app.use(express.json());

app.get("/", (_, res) => {
  res.send(`Hello World!`);
});

app.post("/upload", [verifyApiKey], async (req: Request, res: Response) => {
  const { sampleFile } = req.files;
  if (!sampleFile) return res.status(400).send("No files were uploaded.");

  const uploadedFile = JSON.parse(JSON.stringify(sampleFile));

  const { data, error } = await doOcr(uploadedFile.data.data);

  if (data) return res.status(200).json({ text: data.text, error: null });

  res.status(400).json({ error: error, text: null });
});

app.post("/uploadBase64", [verifyApiKey], async (req: Request, res: Response) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).send("Image not found.");

  const { data, error } = await doOcr(imageBase64);

  if (data) return res.status(200).json({ text: data.text, error: null });

  res.status(400).json({ error: error, text: null });
});

app.post("/signUp", async (req: Request, res: Response) => {
  const { name = "John Doe", email = "john@example.com" } = req.body;

  // Imaginary name and email validation

  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${process.env.UNKEY_ROOT_KEY}`);
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    apiId: process.env.UNKEY_API_ID,
    prefix: "ocr",
    byteLength: 16,
    ownerId: email,
    meta: {
      name: name,
      email: email,
    },
    expires: 1693068350000, // 30 days since 26/07/2023
    ratelimit: {
      type: "fast",
      limit: 1,
      refillRate: 1,
      refillInterval: 10000,
    },
  });


  const createKeyResponse = await fetch(
    "https://api.unkey.dev/v1/keys",
    {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    },
  );
  const createKeyResponseJson = await createKeyResponse.json();

  if (createKeyResponseJson.error)
    return res
      .status(400)
      .json({ error: createKeyResponseJson.error, keys: null });

  return res.status(200).json({ keys: [createKeyResponseJson], error: null });
});

app.post("/upgradeUser", async (req: Request, res: Response) => {

  const { transactionId, email, apiKeyId } = req.body;

  // Imaginary transactionId and email validation.
  // Let's imagine the user upgraded to a paid plan.
  // Now we have to increase the usage quota of the user.
  // We can do that by updating the key.

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", `Bearer ${process.env.UNKEY_ROOT_KEY}`);

  const raw = JSON.stringify({
    "keyId": apiKeyId,
    "ratelimit": {
      "type": "fast",
      "limit": 10000,
      "refillRate": 10000,
      "refillInterval": 2592000000
    }
  });


  const updateKeyRequest = await fetch("https://api.unkey.dev/v1/keys/key_5KCLmfb2HY5czAfmEFNP3h", {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  })

  if (updateKeyRequest.status !== 200) return res.status(400).json({ message: "Something went wrong" })

  return res.status(200).json({ message: "User upgraded successfully" })


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
