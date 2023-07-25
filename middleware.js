const verifyApiKey = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1].trim();

    try {
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      var raw = JSON.stringify({
        key: token,
      });

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const verifyKeyResponse = await fetch(
        "https://api.unkey.dev/v1/keys/verify",
        requestOptions,
      );
      const verifyKeyResponseJson = await verifyKeyResponse.json();

      console.log(verifyKeyResponseJson);

      if (
        !verifyKeyResponseJson.valid &&
        verifyKeyResponseJson.code === "RATELIMITED"
      )
        return res.status(429).json({ message: "RATELIMITED" });

      if (!verifyKeyResponseJson.valid)
        return res.status(401).json({ message: "Unauthorized" });

      next();
    } catch (err) {
      logger.info("ERROR: ", err);
      return res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = verifyApiKey;
