import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Sala } from '../../types';
import { Link } from 'react-router-dom';

const SalasLista = () => {
  const [salas, setSalas] = useState<Sala[]>([]);

  const carregarSalas = async () => {
    try {
        const response = await api.get('/salas');
        setSalas(response.data);
    } catch (error) {
        console.error("Erro ao carregar salas", error);
    }
  };

  useEffect(() => { carregarSalas(); }, []);

  const deletarSala = async (id: string) => {
    if(confirm("Tem certeza que deseja excluir esta sala?")) {
        try {
            await api.delete(`/salas/${id}`);
            carregarSalas(); // Atualiza a lista
        } catch (error) {
            alert("Erro ao excluir sala.");
        }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gerenciamento de Salas</h2>
        <Link to="/salas/novo" className="btn btn-success">
            <i className="bi bi-plus-circle me-2"></i>Nova Sala
        </Link>
      </div>

      {salas.length === 0 ? (
        <div className="alert alert-info">Nenhuma sala cadastrada.</div>
      ) : (
        <div className="table-responsive">
            <table className="table table-striped table-hover shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th>Número da Sala</th>
                        <th>Capacidade</th>
                        <th className="text-end">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {salas.map(sala => (
                    <tr key={sala.id}>
                        <td className="align-middle fw-bold">Sala {sala.numero}</td>
                        <td className="align-middle">{sala.capacidade} lugares</td>
                        <td className="text-end">
                            <button 
                                onClick={() => deletarSala(sala.id)} 
                                className="btn btn-danger btn-sm"
                                title="Excluir Sala"
                            >
                                <i className="bi bi-trash"></i> Excluir
                            </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default SalasLista;