import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game2048 from './pages/Game2048';
import GameSuika from './pages/GameSuika';
import GameSnake from './pages/GameSnake';
import GameStroop from './pages/GameStroop';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/2048" element={<Game2048 />} />
        <Route path="/suika" element={<GameSuika />} />
        <Route path="/snake" element={<GameSnake />} />
        <Route path="/stroop" element={<GameStroop />} />
      </Routes>
    </BrowserRouter>
  );
}
