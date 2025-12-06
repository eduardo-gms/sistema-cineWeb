import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const filmeSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  sinopse: z.string().min(10, "Sinopse deve ter no mínimo 10 caracteres"),
  duracao: z.number({ invalid_type_error: "Insira um número" }).positive("Duração deve ser positiva"),
  classificacao: z.string().min(1, "Classificação obrigatória"),
  genero: z.string().min(1, "Gênero obrigatório"),
  dataEstreia: z.string().min(1, "Data obrigatória"),
});

type FilmeSchema = z.infer<typeof filmeSchema>;

const FilmesForm = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FilmeSchema>({
    resolver: zodResolver(filmeSchema)
  });

  const onSubmit = async (data: FilmeSchema) => {
    try {
        await api.post('/filmes', data);
        alert('Filme cadastrado!');
        navigate('/filmes');
    } catch {
        alert("Erro ao cadastrar.");
    }
  };

  return (
    <div className="card p-4">
      <h3>Cadastro de Filme</h3>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="form-label">Título</label>
          <input {...register('titulo')} className={`form-control ${errors.titulo ? 'is-invalid' : ''}`} />
          <div className="invalid-feedback">{errors.titulo?.message}</div>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Sinopse</label>
          <textarea {...register('sinopse')} className={`form-control ${errors.sinopse ? 'is-invalid' : ''}`} />
          <div className="invalid-feedback">{errors.sinopse?.message}</div>
        </div>

        <div className="row mb-3">
            <div className="col-md-6">
                <label className="form-label">Duração (min)</label>
                <input type="number" {...register('duracao', { valueAsNumber: true })} className={`form-control ${errors.duracao ? 'is-invalid' : ''}`} />
                <div className="invalid-feedback">{errors.duracao?.message}</div>
            </div>
            <div className="col-md-6">
                <label className="form-label">Classificação</label>
                <select {...register('classificacao')} className="form-select">
                    <option value="">Selecione...</option>
                    <option value="Livre">Livre</option>
                    <option value="10">10 anos</option>
                    <option value="12">12 anos</option>
                    <option value="14">14 anos</option>
                    <option value="16">16 anos</option>
                    <option value="18">18 anos</option>
                </select>
                <div className="text-danger small">{errors.classificacao?.message}</div>
            </div>
        </div>

        <div className="row mb-3">
            <div className="col-md-6">
                <label className="form-label">Gênero</label>
                <select {...register('genero')} className="form-select">
                    <option value="">Selecione...</option>
                    <option value="Ação">Ação</option>
                    <option value="Comédia">Comédia</option>
                    <option value="Drama">Drama</option>
                    <option value="Terror">Terror</option>
                    <option value="Ficção">Ficção</option>
                </select>
                <div className="text-danger small">{errors.genero?.message}</div>
            </div>
            <div className="col-md-6">
                <label className="form-label">Data de Estreia</label>
                <input type="date" {...register('dataEstreia')} className={`form-control ${errors.dataEstreia ? 'is-invalid' : ''}`} />
                <div className="invalid-feedback">{errors.dataEstreia?.message}</div>
            </div>
        </div>
        
        <button type="submit" className="btn btn-primary">Salvar</button>
      </form>
    </div>
  );
};

export default FilmesForm;