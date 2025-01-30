import videojs from "video.js";
import { UploadDemo } from "./components/UploadDemo";
import VideoJS from "./components/VideoJs";
import React from "react";

function App() {
  const playerRef = React.useRef(null);

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: "http://127.0.0.1:8090/files/b00d76de5580d2c4cd488f10ffd67ea9",
        type: "video/mp4",
      },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePlayerReady = (player: any) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
  };

  return (
    <>
      <div className="flex justify-center flex-col items-center min-h-screen">
        <div className="card">
          <h1 className="text-2xl font-bold">Resumable Uploader</h1>
          <UploadDemo />
        </div>
        <div className="w-full max-w-4xl mx-auto p-4">
          <hr />
          <h1 className="prose">Video JS</h1>
          <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
        </div>
      </div>
    </>
  );
}

export default App;
