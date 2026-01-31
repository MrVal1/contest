import React, { useState } from 'react';
import { API_URL } from '../api/config';
import './Inscription.css';

interface Grimpeur {
  prenom: string;
  nom: string;
  categorie: string;
  sexe: string;
}

const Inscription: React.FC = () => {
  const [grimpeur, setGrimpeur] = useState<Grimpeur>({
    prenom: '',
    nom: '',
    categorie: '',
    sexe: ''
  });
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const categories = ['U11', 'U13', 'U15', 'U19', 'Senior'];
  const sexes = ['femme', 'homme'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGrimpeur(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grimpeur.prenom || !grimpeur.nom || !grimpeur.categorie || !grimpeur.sexe) {
      setMessage('Tous les champs sont obligatoires');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/grimpeurs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grimpeur),
      });

      if (response.ok) {
        setMessage('Grimpeur inscrit avec succès!');
        setMessageType('success');
        setGrimpeur({
          prenom: '',
          nom: '',
          categorie: '',
          sexe: ''
        });
      } else {
        const error = await response.json();
        setMessage(error.error || 'Erreur lors de l\'inscription');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Erreur de connexion au serveur');
      setMessageType('error');
    }
  };

  return (
    <div className="inscription">
      <div className="inscription-container">
        <h2>Inscription des Grimpeurs</h2>
        
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="inscription-form">
          <div className="form-group">
            <label htmlFor="prenom">Prénom *</label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              value={grimpeur.prenom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nom">Nom *</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={grimpeur.nom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="categorie">Catégorie *</label>
            <select
              id="categorie"
              name="categorie"
              value={grimpeur.categorie}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sexe">Sexe *</label>
            <select
              id="sexe"
              name="sexe"
              value={grimpeur.sexe}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner</option>
              {sexes.map(sexe => (
                <option key={sexe} value={sexe}>
                  {sexe === 'femme' ? 'Femme' : 'Homme'}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-btn">
            Inscrire le grimpeur
          </button>
        </form>
      </div>
    </div>
  );
};

export default Inscription;
