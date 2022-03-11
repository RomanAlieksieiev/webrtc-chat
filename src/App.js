import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import Main from "./pages/Main";
import Room from "./pages/Room";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/webrtc-chat" element={<Main/>} />
        <Route exact path="/room/:id" element={<Room/>} />
        <Route
          path="*"
          element={<Navigate to="/webrtc-chat" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
