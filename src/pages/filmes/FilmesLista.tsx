import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Filme } from '../../types';
import { Link } from 'react-router-dom';

const FilmesLista = () => {
  const [filmes, setFilmes] = useState<Filme[]>([]);

  const carregarFilmes = async () => {
    const response = await api.get('/filmes');
    setFilmes(response.data);
  };

  useEffect(() => { carregarFilmes(); }, []);

  const deletarFilme = async (id: string) => {
    if(confirm("Tem certeza?")) {
        await api.delete(`/filmes/${id}`);
        carregarFilmes();
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h2>Filmes em Cartaz</h2>
        <Link to="/filmes/novo" className="btn btn-success"><i className="bi bi-plus-circle"></i> Novo Filme</Link>
      </div>
      <div className="row">
        {filmes.map(filme => (
          <div key={filme.id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{filme.titulo}</h5>
                <p className="card-text text-muted">{filme.genero} | {filme.duracao} min</p>
                <p className="card-text">{filme.sinopse}</p>
                <button onClick={() => deletarFilme(filme.id)} className="btn btn-danger btn-sm">
                    <i className="bi bi-trash"></i> Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilmesLista;