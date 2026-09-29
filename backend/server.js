const http = require("http");
const port = Number(process.env.BACKEND_PORT || 8000);

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      service: "prism-backend",
      providerDefault: process.env.DEFAULT_PROVIDER || "vertex",
      modelDefault: process.env.DEFAULT_MODEL_ID || "gemini-2.5-flash",
      adc: "enabled-via-runtime",
    }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: { code: "NOT_FOUND", message: "Route not found" } }));
});

server.listen(port, () => {
  console.log(`PRISM backend listening on ${port}`);
});
