import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../api/config';
import './Validation.css';

interface Grimpeur {
  id: number;
  prenom: string;
  nom: string;
  categorie: string;
  sexe: string;
}

interface Bloc {
  id: number;
  nom: string;
  zones: Zone[];
}

interface Zone {
  id: number;
  nom: string;
  ordre: number;
}

interface Contest {
  id: number;
  nom: string;
  debut: string;
  fin: string;
  actif: boolean;
}

const Validation: React.FC = () => {
  const [grimpeurs, setGrimpeurs] = useState<Grimpeur[]>([]);
  const [blocs, setBlocs] = useState<Bloc[]>([]);
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [selectedGrimpeur, setSelectedGrimpeur] = useState<string>('');
  const [validations, setValidations] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchActiveContest();
    fetchGrimpeurs();
  }, []);

  useEffect(() => {
    if (activeContest) {
      fetchBlocs();
    }
  }, [activeContest]);

  const fetchActiveContest = async () => {
    try {
      const response = await fetch(`${API_URL}/contest/active`);
      const data = await response.json();
      setActiveContest(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du contest actif:', error);
    }
  };

  const fetchGrimpeurs = async () => {
    try {
      const response = await fetch(`${API_URL}/grimpeurs`);
      const data = await response.json();
      setGrimpeurs(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des grimpeurs:', error);
    }
  };

  const fetchBlocs = useCallback(async () => {
    if (!activeContest) return;
    
    console.log('Fetching blocs for contest:', activeContest.id);
    
    try {
      const response = await fetch(`${API_URL}/blocs?contest_id=${activeContest.id}`);
      const data = await response.json();
      
      console.log('Blocs received:', data.length);
      
      // Récupérer les zones pour chaque bloc
      const blocsWithZones = await Promise.all(
        data.map(async (bloc: any) => {
          const zonesResponse = await fetch(`${API_URL}/zones?bloc_id=${bloc.id}`);
          const zones = await zonesResponse.json();
          return {
            ...bloc,
            zones: zones.sort((a: Zone, b: Zone) => a.ordre - b.ordre)
          };
        })
      );
      
      setBlocs(blocsWithZones);
    } catch (error) {
      console.error('Erreur lors de la récupération des blocs:', error);
    }
  }, [activeContest]);

  const fetchValidations = async (grimpeurId: string) => {
    if (!grimpeurId) return;
    
    try {
      const response = await fetch(`${API_URL}/validations?grimpeur_id=${grimpeurId}`);
      const data = await response.json();
      setValidations(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des validations:', error);
    }
  };

  const handleGrimpeurChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const grimpeurId = e.target.value;
    setSelectedGrimpeur(grimpeurId);
    fetchValidations(grimpeurId);
  };

  const handleValidation = async (zoneId: number, blocId: number, estTop: boolean = false) => {
    if (!selectedGrimpeur) {
      setMessage('Veuillez sélectionner un grimpeur');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/validations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grimpeur_id: selectedGrimpeur,
          zone_id: zoneId,
          bloc_id: blocId,
          est_top: estTop ? 1 : 0
        }),
      });

      if (response.ok) {
        setMessage(estTop ? 'Zone validée avec succès!' : 'Zone validée avec succès!');
        setMessageType('success');
        fetchValidations(selectedGrimpeur);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Erreur lors de la validation');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
      setMessageType('error');
    }
  };

  const handleZoneValidation = (zoneId: number, blocId: number) => {
    handleValidation(zoneId, blocId, false);
  };

  const handleTopValidation = async (zoneId: number, blocId: number) => {
    if (!selectedGrimpeur) {
      setMessage('Veuillez sélectionner un grimpeur');
      setMessageType('error');
      return;
    }

    try {
      // Vérifier si la zone est déjà validée
      const zoneAlreadyValidated = isZoneValidated(zoneId);
      
      // Si la zone n'est pas encore validée, la valider d'abord
      if (!zoneAlreadyValidated) {
        const zoneResponse = await fetch(`${API_URL}/validations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grimpeur_id: selectedGrimpeur,
            zone_id: zoneId,
            bloc_id: blocId,
            est_top: 0
          }),
        });

        if (!zoneResponse.ok) {
          throw new Error('Erreur lors de la validation de la zone');
        }
      }

      // Ensuite valider le top
      const topResponse = await fetch(`${API_URL}/validations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grimpeur_id: selectedGrimpeur,
          zone_id: zoneId,
          bloc_id: blocId,
          est_top: 1
        }),
      });

      if (topResponse.ok) {
        setMessage(zoneAlreadyValidated ? 'Top validé avec succès!' : 'Zone et top validés avec succès!');
        setMessageType('success');
        
        // Forcer le rafraîchissement pour tout mettre à jour
        await fetchValidations(selectedGrimpeur);
      } else {
        const error = await topResponse.json();
        setMessage(error.error || 'Erreur lors de la validation du top');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
      setMessageType('error');
    }
  };

  const handleIntermediaireValidation = async (zoneId: number, blocId: number) => {
    if (!selectedGrimpeur) {
      setMessage('Veuillez sélectionner un grimpeur');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/validations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grimpeur_id: selectedGrimpeur,
          zone_id: zoneId,
          bloc_id: blocId,
          est_top: 2 // 2 pour validation intermédiaire
        }),
      });

      if (response.ok) {
        setMessage('Zone intermédiaire validée avec succès!');
        setMessageType('success');
        fetchValidations(selectedGrimpeur);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Erreur lors de la validation intermédiaire');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
      setMessageType('error');
    }
  };

  const handleResetBloc = async (blocId: number) => {
    if (!selectedGrimpeur) {
      setMessage('Veuillez sélectionner un grimpeur');
      setMessageType('error');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les validations de ce bloc?')) {
      return;
    }

    try {
      // Récupérer toutes les zones du bloc
      const zonesResponse = await fetch(`${API_URL}/zones?bloc_id=${blocId}`);
      const zones = await zonesResponse.json();

      // Supprimer toutes les validations pour ce grimpeur et ce bloc
      for (const zone of zones) {
        await fetch(`${API_URL}/validations?grimpeur_id=${selectedGrimpeur}&zone_id=${zone.id}`, {
          method: 'DELETE'
        });
      }

      // Supprimer aussi la validation du top
      await fetch(`${API_URL}/validations?grimpeur_id=${selectedGrimpeur}&bloc_id=${blocId}&est_top=1`, {
        method: 'DELETE'
      });

      setMessage('Bloc réinitialisé avec succès!');
      setMessageType('success');
      fetchValidations(selectedGrimpeur);
    } catch (error) {
      setMessage('Erreur lors de la réinitialisation');
      setMessageType('error');
    }
  };

  const isZoneValidated = (zoneId: number) => {
    const result = validations.some(v => v.zone_id === zoneId && !v.est_top);
    console.log('isZoneValidated for zone', zoneId, ':', result, 'validations:', validations);
    return result;
  };

  const isTopValidated = (blocId: number) => {
    const result = validations.some(v => v.bloc_id === blocId && v.est_top);
    console.log('isTopValidated for bloc', blocId, ':', result, 'validations:', validations);
    return result;
  };

  const isIntermediaireValidated = (zoneId: number, blocId: number) => {
    const result = validations.some(v => v.zone_id === zoneId && v.est_top === 2);
    console.log('isIntermediaireValidated for zone', zoneId, ':', result, 'validations:', validations);
    return result;
  };

  const hasAnyValidation = (blocId: number) => {
    return validations.some(v => v.bloc_id === blocId);
  };

  const isContestFinished = () => {
    if (!activeContest || !activeContest.fin) return false;
    const now = new Date();
    const endTime = new Date(activeContest.fin);
    return now > endTime;
  };

  return (
    <div className="validation">
      <div className="validation-container">
        <h2>Validation des Blocs</h2>
        
        {activeContest && (
          <div className="contest-info">
            <h3>Contest: {activeContest.nom}</h3>
            {isContestFinished() && (
              <div className="contest-finished-warning">
                ⚠️ Le contest est terminé. Les validations ne sont plus possibles.
              </div>
            )}
          </div>
        )}
        
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="grimpeur-selector">
          <label htmlFor="grimpeur">Sélectionner un grimpeur:</label>
          <select
            id="grimpeur"
            value={selectedGrimpeur}
            onChange={handleGrimpeurChange}
          >
            <option value="">Choisir un grimpeur...</option>
            {grimpeurs.map(grimpeur => (
              <option key={grimpeur.id} value={grimpeur.id}>
                {grimpeur.prenom} {grimpeur.nom} - {grimpeur.categorie} - {grimpeur.sexe}
              </option>
            ))}
          </select>
        </div>

        {selectedGrimpeur && (
          <div className="grimpeur-info">
            <h3>{grimpeurs.find(g => g.id.toString() === selectedGrimpeur)?.prenom} {grimpeurs.find(g => g.id.toString() === selectedGrimpeur)?.nom}</h3>
            <p>Catégorie: {grimpeurs.find(g => g.id.toString() === selectedGrimpeur)?.categorie} | Sexe: {grimpeurs.find(g => g.id.toString() === selectedGrimpeur)?.sexe}</p>
          </div>
        )}

        {selectedGrimpeur && blocs.length > 0 && !isContestFinished() && (
          <div className="blocs-container">
            {blocs.map(bloc => (
              <div key={bloc.id} className="bloc-card">
                <h3>{bloc.nom}</h3>
                
                {/* Afficher la zone du bloc sans texte */}
                {bloc.zones.length > 0 && (
                  <div className="zone-item">
                    <div className="validation-buttons">
                      {/* Bouton pour valider la zone */}
                      <button
                        className={`validate-btn zone-btn ${isZoneValidated(bloc.zones[0].id) ? 'validated' : ''}`}
                        onClick={() => handleZoneValidation(bloc.zones[0].id, bloc.id)}
                        disabled={isZoneValidated(bloc.zones[0].id)}
                      >
                        {isZoneValidated(bloc.zones[0].id) ? '✓ Zone' : 'Zone'}
                      </button>
                      
                      {/* Bouton pour valider le bloc (top) */}
                      <button
                        className={`validate-btn bloc-btn ${isTopValidated(bloc.id) ? 'validated' : ''}`}
                        onClick={() => handleTopValidation(bloc.zones[0].id, bloc.id)}
                        disabled={isTopValidated(bloc.id)}
                      >
                        {isTopValidated(bloc.id) ? '🏆 Bloc' : '🏆 Bloc'}
                      </button>
                      
                      {/* Bouton de réinitialisation si nécessaire */}
                      {hasAnyValidation(bloc.id) && (
                        <button
                          className="reset-btn"
                          onClick={() => handleResetBloc(bloc.id)}
                          title="Réinitialiser ce bloc"
                        >
                          🔄
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedGrimpeur && blocs.length > 0 && isContestFinished() && (
          <div className="contest-finished-message">
            🏁 Le contest est terminé. Les validations de blocs ne sont plus possibles.
          </div>
        )}

        {selectedGrimpeur && blocs.length === 0 && (
          <div className="no-blocs">
            <p>Aucun bloc configuré pour ce contest.</p>
            <p>Utilisez l'onglet "⚡ Quick Setup" dans l'Admin pour créer des blocs rapidement.</p>
          </div>
        )}

        {!activeContest && (
          <div className="no-contest">
            <p>Aucun contest actif trouvé.</p>
            <p>Veuillez activer un contest depuis l'Admin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Validation;
