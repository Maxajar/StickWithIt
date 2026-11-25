// Minimal static server for a Unity WebGL build (no dependencies).
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".wasm": "application/wasm",
  ".data": "application/octet-stream",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";

    const filePath = path.join(ROOT, path.normalize(urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        return res.end("Not found");
      }

      // Unity compressed builds: .br / .gz need Content-Encoding and the
      // content type of the underlying file.
      let name = filePath;
      const headers = {};
      if (name.endsWith(".br")) {
        headers["Content-Encoding"] = "br";
        name = name.slice(0, -3);
      } else if (name.endsWith(".gz")) {
        headers["Content-Encoding"] = "gzip";
        name = name.slice(0, -3);
      }
      headers["Content-Type"] =
        TYPES[path.extname(name)] || "application/octet-stream";
      headers["Content-Length"] = stat.size;

      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    });
  })
  .listen(PORT, () => console.log("Listening on " + PORT));
