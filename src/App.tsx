import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import FilmesLista from './pages/filmes/FilmesLista';
import FilmesForm from './pages/filmes/FilmesForm';
import SalasLista from './pages/salas/SalasLista';
import SalasForm from './pages/salas/SalasForm';
import SessoesManager from './pages/sessoes/SessoesManager';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container mt-4">
        <Routes>
            <Route path="/" element={
                <div className="text-center mt-5">
                    <h1>Bem-vindo ao CineWeb</h1>
                    <p className="lead">Utilize o menu acima para gerenciar o cinema.</p>
                </div>
            } />
            <Route path="/filmes" element={<FilmesLista />} />
            <Route path="/filmes/novo" element={<FilmesForm />} />
            <Route path="/salas" element={<SalasLista />} />
            <Route path="/salas/novo" element={<SalasForm />} />
            <Route path="/sessoes" element={<SessoesManager />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App;