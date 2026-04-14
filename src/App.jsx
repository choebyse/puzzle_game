import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game2048 from './pages/Game2048';
import GameSuika from './pages/GameSuika';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/2048" element={<Game2048 />} />
        <Route path="/suika" element={<GameSuika />} />
      </Routes>
    </BrowserRouter>
  );
}
