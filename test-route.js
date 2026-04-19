const { protect } = require("./backend/src/middleware/auth");
const reportRoutes = require("./backend/src/routes/reportRoutes");
const express = require("express");
const app = express();
app.use("/api/reports", reportRoutes);

app.use((error, req, res, next) => {
  console.error("APP ERROR:", error);
  res.status(500).json({ message: error.message });
});

// Since we have DB and models, let's mock the request.
const request = require("http");
app.listen(9999, () => {
    console.log("Listening on 9999");
    const options = {
        hostname: "127.0.0.1",
        port: 9999,
        path: "/api/reports/weekly",
        method: "GET"
    };

    const req = request.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log("STATUS:", res.statusCode);
            console.log("RESPONSE:", data);
            process.exit(0);
        });
    });

    req.on("error", (e) => {
        console.error("REQ ERROR:", e);
        process.exit(1);
    });
    req.end();
});
