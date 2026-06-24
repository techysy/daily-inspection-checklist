import { useState } from 'react';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { Home } from './pages/Home';
import { History } from './pages/History';
import DataAnalysis from './pages/DataAnalysis';

type Page = 'home' | 'history' | 'analysis';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  return (
    <div className="min-h-screen bg-gray-100">
      <Toast />
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main>
        {currentPage === 'home' && <Home />}
        {currentPage === 'history' && <History />}
        {currentPage === 'analysis' && <DataAnalysis />}
      </main>
    </div>
  );
}
