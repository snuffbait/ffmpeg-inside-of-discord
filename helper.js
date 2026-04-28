const http = require("http");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const busboy = require("busboy");

http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    if (req.method !== "POST") { res.writeHead(405); return res.end(); }

    const bb = busboy({ headers: req.headers });
    const tmp = path.join(os.tmpdir(), `dc_${Date.now()}.mp4`);
    const out = tmp.replace(".mp4", "_c.mp4");

    bb.on("file", (_, stream) => {
        const writer = fs.createWriteStream(tmp);
        stream.pipe(writer);

        writer.on("finish", () => {
            try {
                const dur = parseFloat(
                    execSync(
                        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tmp}"`
                    ).toString().trim()
                );

                const bits = 7.5 * 8 * 1024 * 1024;
                const audio = 128 * 1024;
                const bitrate = Math.max(Math.floor(((bits / dur) - audio) / 1024), 100);

                execSync(
                    `ffmpeg -i "${tmp}" -c:v libx264 -b:v ${bitrate}k -preset medium -c:a aac -b:a 128k -y "${out}"`, //nitro free method
                    { stdio: "ignore" }
                );

                res.writeHead(200, { "Content-Type": "video/mp4" });
                fs.createReadStream(out).pipe(res);

                res.on("finish", () => {
                    fs.rmSync(tmp, { force: true });
                    fs.rmSync(out, { force: true });
                });
            } catch (e) {
                console.error("errorrr ", e.message);
                fs.rmSync(tmp, { force: true });
                fs.rmSync(out, { force: true });
                res.writeHead(500);
                res.end();
            }
        });
    });

    req.pipe(bb);
}).listen(7123, "127.0.0.1", () => {
    console.log("Running on http://127.0.0.1:7123");
    console.log("Waiting for files :3");
});
