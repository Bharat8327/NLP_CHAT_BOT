import { Route, Routes } from 'react-router-dom';
import './index.css';
import Login from './pages/Login.jsx';
import HomePage from './pages/HomePgae.jsx';

const App = () => {
  return (
    <>
      <div>
        <Routes>
          <Route path="*" element={<p>404 page not found </p>} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </>
  );
};

export default App;
