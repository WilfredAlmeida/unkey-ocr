import { Request, Response, NextFunction } from "express";


const verifyApiKey = async (req:Request, res:Response, next:NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1].trim();

    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        key: token,
      });

      const verifyKeyResponse = await fetch(
        "https://api.unkey.dev/v1/keys/verify",
        {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        },
      );
      const verifyKeyResponseJson = await verifyKeyResponse.json();

      if (
        !verifyKeyResponseJson.valid &&
        verifyKeyResponseJson.code === "RATELIMITED"
      )
        return res.status(429).json({ message: "RATELIMITED" });

      if (!verifyKeyResponseJson.valid)
        return res.status(401).json({ message: "Unauthorized" });

      next();
    } catch (err) {
      console.log("ERROR: ", err);
      return res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default verifyApiKey;
