const express = require("express");
const fs = require("node:fs/promises");
const path = require("path");
const cors = require("cors");
const { Server, EVENTS } = require("@tus/server");
const { FileStore } = require("@tus/file-store");

const app = express();
const host = "127.0.0.1";
const port = 8090;

const uploadDirectory = "./files";
const destinationDirectory = "./processed_files";

// Ensure both upload and destination directories exist
Promise.all([
  fs.mkdir(uploadDirectory, { recursive: true }),
  fs.mkdir(destinationDirectory, { recursive: true }),
]).catch(console.error);

// Enable CORS for React frontend
app.use(cors());

// Initialize TUS server
const tusServer = new Server({
  path: "/files",
  datastore: new FileStore({ directory: uploadDirectory }),
}).on("error", (error) => {
  console.error("TUS Server Error:", error);
});

// Handle file upload completion with enhanced error logging
tusServer.on(EVENTS.POST_FINISH, async (req, res, upload) => {
  console.log(EVENTS.POST_FINISH, upload);

  try {
    const tempFilePath = path.join(uploadDirectory, upload.id);
    const destinationFilePath = path.join(
      destinationDirectory,
      upload.metadata.filename
    );

    // Copy file to the processed folder
    await fs.copyFile(tempFilePath, destinationFilePath);

    console.log(`File copied to: ${destinationFilePath}`);
  } catch (error) {
    console.error("Error copying file:", error);
  }
});

// API Route: Get list of processed files
app.get("/api/files", async (req, res) => {
  try {
    const files = await fs.readdir(destinationDirectory);
    res.json({ files });
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
});

// Test API Route
app.get("/api/test", (req, res) => {
  res.send("Test successful!");
});

// Use the TUS server as middleware
app.use(tusServer.handle.bind(tusServer));

// Start Express server
app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
