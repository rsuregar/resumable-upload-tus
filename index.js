const fs = require("node:fs/promises");
const path = require("path"); // Add this line
const { Server, EVENTS } = require("@tus/server");
const { FileStore } = require("@tus/file-store");
const host = "127.0.0.1";
const port = 1080;
const uploadDirectory = "./files";
const destinationDirectory = "./processed_files"; // Destination folder

// Ensure the destination folder exists
fs.mkdir(destinationDirectory, { recursive: true }).catch(console.error);

const server = new Server({
  path: "/files",
  datastore: new FileStore({ directory: uploadDirectory }),
});

server.on(EVENTS.POST_FINISH, async (req, res, upload) => {
  console.log(EVENTS.POST_FINISH, upload);

  try {
    const tempFilePath = path.join(uploadDirectory, upload.id);
    const destinationFilePath = path.join(
      destinationDirectory,
      upload.metadata.filename
    );

    // Copy the file to the new folder with the original filename
    await fs.copyFile(tempFilePath, destinationFilePath);

    console.log(`File copied to: ${destinationFilePath}`);
  } catch (error) {
    console.error("Error copying file:", error);
  }
});

server.get("/", async (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(await fs.readFile("./index.html"));
  res.end();
});

server.listen({ host, port });
