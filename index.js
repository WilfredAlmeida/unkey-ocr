const express = require("express")
const fileUpload = require("express-fileupload")
const Tesseract = require("tesseract.js")

const app = express()

app.use(fileUpload())
app.use(express.json())

app.get("/", (_, res) => {
    res.send(`
    <form action='/upload' method='post' encType="multipart/form-data">
      <input type="file" name="sampleFile" />
      <input type='submit' value='Upload!' />
    </form>`)
})

app.post("/upload", async (req, res) => {
    const { sampleFile } = req.files
    if (!sampleFile) return res.status(400).send("No files were uploaded.")

    const { data, error } = await doOcr(sampleFile.data)

    if (data) return res.status(200).json({ text: data.text, error: null })

    res.status(400).json({ error: error, text: null })

})

app.post("/uploadBase64", async (req, res) => {
    
    const { imageBase64 } = req.body
    if (!imageBase64) return res.status(400).send("Image not found.")

    const { data, error } = await doOcr(imageBase64)

    if (data) return res.status(200).json({ text: data.text, error: null })

    res.status(400).json({ error: error, text: null })
})

const doOcr = async (image) => {
    try {
        const { data } = await Tesseract.recognize(image, "spa+eng", {
            logger: (m) => console.log(m),
        })
        return { data: data, error: null }
    } catch (error) {
        console.log(error);
        return { data: null, error: error }
    }
}

app.listen(process.env.PORT || 3000, () => console.log("Server started on port 3000"))