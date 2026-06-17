import { useState } from 'react';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { History } from './pages/History';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'history'>('home');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main>
        {currentPage === 'home' ? <Home /> : <History />}
      </main>
    </div>
  );
}
