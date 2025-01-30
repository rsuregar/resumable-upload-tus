/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useId } from "react";
import * as tus from "tus-js-client";
import ago from "s-ago";
import prettyBytes from "pretty-bytes";

export function UploadDemo() {
  const id = useId();
  const [supported] = useState(tus.isSupported);
  const [upload, setUpload] = useState<tus.Upload | null>(null);
  const [previousUploads, setPreviousUploads] = useState<tus.PreviousUpload[]>(
    []
  );
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [showPreviousUploads, setShowPreviousUploads] = useState(false);
  const [isUploadRunning, setIsUploadRunning] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState("0%");
  const [progress, setProgress] = useState("");

  const startUpload = useCallback(() => {
    console.log("start");
    if (!upload) return;

    upload.options.onError = (error: any) => {
      console.log("demo: error", error);
      if (error instanceof tus.DetailedError && error.originalRequest) {
        const text = `Upload failed due to network issues or server error. Retry?\n\nDetails: ${error.message}`;
        if (window.confirm(text)) {
          upload.start();
          return;
        }
      } else {
        alert("Failed: " + error.message);
      }
      setIsUploadRunning(false);
      setUpload(null);
    };

    upload.options.onProgress = (bytesUploaded, bytesTotal) => {
      const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2) + "%";
      setProgressBarWidth(percentage);
      setProgress(
        `Uploaded ${prettyBytes(bytesUploaded)} of ${prettyBytes(
          bytesTotal
        )} (${percentage})`
      );
      console.log("demo: progress", bytesUploaded, bytesTotal, percentage);
    };

    upload.options.onSuccess = () => {
      setShowUploadProgress(false);
      setIsUploadComplete(true);
    };

    setShowPreviousUploads(false);
    setShowUploadProgress(true);
    setIsUploadRunning(true);
    upload.start();
  }, [upload]);

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      console.log("demo: selected file", file);
      const options = {
        endpoint: "http://127.0.0.1:8090/files", // Replace with your TUS server URL
        metadata: { filename: file.name, filetype: file.type },
        addRequestId: true,
      };

      const newUpload = new tus.Upload(file, options);
      console.log("start upload");
      const allPreviousUploads = await newUpload.findPreviousUploads();
      const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
      const lastThreeHrsPrevUploads = allPreviousUploads
        .filter(
          (upload) => new Date(upload.creationTime).getTime() > threeHoursAgo
        )
        .sort(
          (a, b) =>
            new Date(b.creationTime).getTime() -
            new Date(a.creationTime).getTime()
        );

      setUpload(newUpload);
      setPreviousUploads(lastThreeHrsPrevUploads);

      if (lastThreeHrsPrevUploads.length === 0) {
        startUpload();
      } else {
        setShowPreviousUploads(true);
      }
    },
    [startUpload]
  );

  return (
    <>
      {!supported && (
        <p className="bg-red-100 text-red-700 p-4 rounded">
          <strong>Warning!</strong> Your browser does not support file uploads.
        </p>
      )}
      <noscript>
        <p className="bg-red-100 text-red-700 p-4 rounded">
          <strong>Warning!</strong> JavaScript is required for this demo.
        </p>
      </noscript>
      {supported && (
        <div className="space-y-4">
          {!upload && (
            <>
              <label htmlFor={id} className="block text-lg font-semibold mb-2">
                Select a file to upload
              </label>
              <input
                id={id}
                type="file"
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded"
              />
            </>
          )}
          {upload && showUploadProgress && (
            <>
              <p className="text-xl font-semibold">
                {isUploadRunning ? "Uploading..." : "Paused"}
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: progressBarWidth }}
                  />
                </div>
                <button
                  className="bg-blue-500 text-blue-50 px-4 py-2 rounded"
                  onClick={() => {
                    if (isUploadRunning) {
                      upload.abort();
                      setIsUploadRunning(false);
                    } else {
                      upload.start();
                      setIsUploadRunning(true);
                    }
                  }}
                >
                  {isUploadRunning ? "Pause" : "Resume"}
                </button>
              </div>
              <p className="mt-2 text-sm">{progress}</p>
            </>
          )}
          {upload && showPreviousUploads && previousUploads.length > 0 && (
            <>
              <p className="text-xl font-semibold">
                You started uploading this file{" "}
                {ago(new Date(previousUploads[0].creationTime))}. Resume?
              </p>
              <div className="flex space-x-4">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={() => {
                    upload.resumeFromPreviousUpload(previousUploads[0]);
                    startUpload();
                  }}
                >
                  Yes, resume
                </button>
                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                  onClick={startUpload}
                >
                  No, start over
                </button>
              </div>
            </>
          )}
          {isUploadComplete && (
            <>
              <p className="text-xl font-semibold">Upload complete!</p>
              <div className="flex space-x-4">
                {upload?.file instanceof File && (
                  <a
                    href={upload.url ?? ""}
                    target="_blank"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    rel="noreferrer"
                  >
                    Download {upload.file.name} ({prettyBytes(upload.file.size)}
                    )
                  </a>
                )}
                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                  onClick={() => {
                    setUpload(null);
                    setPreviousUploads([]);
                    setShowUploadProgress(false);
                    setShowPreviousUploads(false);
                  }}
                >
                  Upload another file
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
