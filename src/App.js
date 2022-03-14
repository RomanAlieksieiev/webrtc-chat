import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import Main from './pages/Main';
import Room from './pages/Room';
import 'antd/dist/antd.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path='/' element={<Main/>} />
        <Route exact path='/room/:id' element={<Room/>} />
        <Route
          path='*'
          element={<Navigate to='/' />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
