import { UploadDemo } from "./components/UploadDemo";

function App() {
  return (
    <>
      <div className="flex justify-center items-center min-h-screen">
        <div className="card">
          <h1 className="text-2xl font-bold">Resumable Uploader</h1>
          <UploadDemo />
        </div>
      </div>
    </>
  );
}

export default App;
