import { Route, Routes } from 'react-router-dom';
import './index.css';
import Login from './pages/Login.jsx';
import HomePage from './pages/HomePgae.jsx';
import { Room, createLocalAudioTrack } from 'livekit-client';

const App = () => {
  return (
    <>
      <div>
        <Routes>
          <Route path="*" element={<p>404 page not found </p>} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomePage />} />
          {/* <Route path="/voice" element={<Voice />} /> */}
        </Routes>
      </div>
    </>
  );
};

export default App;

// export const Voice = () => {
//   async function joinRoom() {
//     const identity = 'web_' + Math.random().toString(36).slice(2, 6);
//     const room = 'default-room';
//     const res = await fetch(
//       `${
//         import.meta.env.VITE_TOKEN_SERVER
//       }/token?identity=${identity}&room=${room}`,
//     );
//     const data = await res.json();
//     console.log('Fetched token:', data);

//     if (!data.token) {
//       alert('Token not received from server');
//       return;
//     }

//     const lkRoom = new Room();
//     // 🚀 CORRECTED LINE: Pass the token string from the data object
//     await lkRoom.connect(import.meta.env.VITE_LIVEKIT_WS_URL, data.token);

//     const [audioTrack] = await createLocalAudioTrack();
//     await lkRoom.localParticipant.publishTrack(audioTrack);
//   }

//   return (
//     <button className="bg-red-500 text-white p-2" onClick={joinRoom}>
//       Join with mic
//     </button>
//   );
// };
