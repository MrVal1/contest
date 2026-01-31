import React, { useState, useEffect } from 'react';
import { API_URL } from '../api/config';
import './Classement.css';

interface ClassementEntry {
  id: number;
  prenom: string;
  nom: string;
  categorie: string;
  sexe: string;
  zones_valides: number;
  tops_valides: number;
  score_total: number;
}

const Classement: React.FC = () => {
  const [classement, setClassement] = useState<ClassementEntry[]>([]);
  const [filteredClassement, setFilteredClassement] = useState<ClassementEntry[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<string>('');
  const [selectedSexe, setSelectedSexe] = useState<string>('');

  const categories = ['', 'U11', 'U13', 'U15', 'U19', 'Senior'];
  const sexes = ['', 'femme', 'homme'];

  useEffect(() => {
    fetchClassement();
  }, []);

  const fetchClassement = async () => {
    try {
      const response = await fetch(`${API_URL}/rankings`);
      const data = await response.json();
      setClassement(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
    }
  };

  const filterClassement = React.useCallback(() => {
    let filtered = [...classement];
    
    // Filtrer pour n'afficher que les participants ayant validé des points
    filtered = filtered.filter(entry => entry.zones_valides > 0 || entry.tops_valides > 0);
    
    if (selectedCategorie) {
      filtered = filtered.filter(entry => entry.categorie === selectedCategorie);
    }
    
    if (selectedSexe) {
      filtered = filtered.filter(entry => entry.sexe === selectedSexe);
    }
    
    setFilteredClassement(filtered);
  }, [classement, selectedCategorie, selectedSexe]);

  useEffect(() => {
    filterClassement();
  }, [filterClassement]);

  const getRank = (index: number) => {
    return index + 1;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-normal';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <div className="classement">
      <div className="classement-container">
        <h2>🏆 Classement</h2>
        
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="categorie">Catégorie:</label>
            <select
              id="categorie"
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat || 'Toutes'}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sexe">Sexe:</label>
            <select
              id="sexe"
              value={selectedSexe}
              onChange={(e) => setSelectedSexe(e.target.value)}
            >
              {sexes.map(sexe => (
                <option key={sexe} value={sexe}>
                  {sexe === 'femme' ? 'Femme' : sexe === 'homme' ? 'Homme' : 'Tous'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="classement-stats">
          <span className="total-participants">
            {filteredClassement.length} participant{filteredClassement.length > 1 ? 's' : ''} avec des points
          </span>
          {classement.length > filteredClassement.length && (
            <span className="excluded-participants">
              ({classement.length - filteredClassement.length} participant{classement.length - filteredClassement.length > 1 ? 's' : ''} sans points)
            </span>
          )}
        </div>

        {filteredClassement.length > 0 ? (
          <div className="classement-table">
            <div className="table-header">
              <div className="header-rank">Rang</div>
              <div className="header-name">Nom</div>
              <div className="header-category">Catégorie</div>
              <div className="header-sex">Sexe</div>
              <div className="header-zones">Zones</div>
              <div className="header-tops">Tops</div>
              <div className="header-score">Score</div>
            </div>
            
            {filteredClassement.map((entry, index) => (
              <div key={entry.id} className="table-row">
                <div className="cell-rank">
                  <span className={`rank-number ${getRankColor(getRank(index))}`}>
                    {getRankEmoji(getRank(index))} {getRank(index)}
                  </span>
                </div>
                <div className="cell-name">
                  <span className="grimpeur-name">
                    {entry.prenom} {entry.nom}
                  </span>
                </div>
                <div className="cell-category">{entry.categorie}</div>
                <div className="cell-sex">
                  {entry.sexe === 'femme' ? 'Femme' : 'Homme'}
                </div>
                <div className="cell-zones">{entry.zones_valides}</div>
                <div className="cell-tops">{entry.tops_valides}</div>
                <div className="cell-score">
                  <span className="score-value">
                    {entry.score_total !== null ? entry.score_total.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>Aucun résultat trouvé pour les filtres sélectionnés.</p>
          </div>
        )}

        <div className="score-info">
          <h3>Comment les points sont calculés:</h3>
          <ul>
            <li>Chaque zone et chaque top valent 1000 points de base</li>
            <li>Les points sont divisés par le nombre de grimpeurs ayant validé la même zone/top</li>
            <li>Score total = somme des points obtenus</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Classement;
