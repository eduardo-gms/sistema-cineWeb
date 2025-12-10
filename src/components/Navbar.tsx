import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">CineWeb</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link" to="/filmes">Filmes</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/salas">Salas</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/sessoes">Sessões</Link></li>
            {/* LINK NOVO */}
            <li className="nav-item"><Link className="nav-link" to="/lanches">Lanches & Combos</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;