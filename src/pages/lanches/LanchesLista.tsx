import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { type LancheCombo } from '../../types';

const LanchesLista = () => {
    const [lanches, setLanches] = useState<LancheCombo[]>([]);

    useEffect(() => {
        api.get('/lanches').then(res => setLanches(res.data));
    }, []);

    return (
        <div>
            <div className="d-flex justify-content-between mb-3">
                <h2>Bombonière (Lanches)</h2>
                <Link to="/lanches/novo" className="btn btn-success"><i className="bi bi-plus-circle"></i> Novo Lanche</Link>
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th>Nome</th>
                            <th>Descrição</th>
                            <th>Valor Unitário</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lanches.map(l => (
                            <tr key={l.id}>
                                <td>{l.nome}</td>
                                <td>{l.descricao}</td>
                                <td>R$ {l.valorUnitario.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LanchesLista;