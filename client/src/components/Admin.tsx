import React, { useState, useEffect } from 'react';
import { API_URL } from '../api/config';
import './Admin.css';

interface Contest {
  id: number;
  nom: string;
  debut: string;
  fin: string;
  actif: boolean;
}

interface Bloc {
  id: number;
  contest_id: number;
  nom: string;
  description: string;
}

interface Zone {
  id: number;
  bloc_id: number;
  nom: string;
  ordre: number;
}

interface Grimpeur {
  id: number;
  nom: string;
  prenom: string;
  categorie: string;
  sexe: 'homme' | 'femme';
}

interface AdminProps {
  onContestChange?: () => void;
}

const Admin: React.FC<AdminProps> = ({ onContestChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'contests' | 'blocs' | 'participants' | 'results'>('contests');
  const [contests, setContests] = useState<Contest[]>([]);
  const [blocs, setBlocs] = useState<Bloc[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [grimpeurs, setGrimpeurs] = useState<Grimpeur[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [newContest, setNewContest] = useState({
    nom: '',
    debut: '',
    fin: ''
  });

  const [editingContest, setEditingContest] = useState<number | null>(null);
  const [editContest, setEditContest] = useState({
    nom: '',
    debut: '',
    fin: ''
  });

  const [newBloc, setNewBloc] = useState({
    contest_id: '',
    nombre_blocs: ''
  });

  const [editingBloc, setEditingBloc] = useState<number | null>(null);
  const [editBloc, setEditBloc] = useState({
    nom: '',
    description: '',
    contest_id: ''
  });

  // États pour la gestion des résultats
  const [selectedGrimpeurForResults, setSelectedGrimpeurForResults] = useState<string>('');
  const [validationsForGrimpeur, setValidationsForGrimpeur] = useState<any[]>([]);
  const [blocsWithZones, setBlocsWithZones] = useState<any[]>([]);

  const [newZone, setNewZone] = useState({
    bloc_id: '',
    nom: '',
    ordre: 1
  });

  const [newGrimpeur, setNewGrimpeur] = useState({
    nom: '',
    prenom: '',
    categorie: '',
    sexe: 'homme'
  });

  const [editingGrimpeur, setEditingGrimpeur] = useState<number | null>(null);
  const [editGrimpeur, setEditGrimpeur] = useState({
    nom: '',
    prenom: '',
    categorie: '',
    sexe: 'homme'
  });

  const categories = ['U11', 'U13', 'U15', 'Senior'];

  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchContests();
      fetchBlocs();
      fetchZones();
      fetchGrimpeurs();
    }
  }, []);

  const fetchContests = async () => {
    try {
      const response = await fetch(`${API_URL}/contests`);
      const data = await response.json();
      setContests(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des contests:', error);
    }
  };

  const fetchBlocs = async () => {
    try {
      const response = await fetch(`${API_URL}/blocs`);
      const data = await response.json();
      setBlocs(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des blocs:', error);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await fetch(`${API_URL}/zones`);
      const data = await response.json();
      setZones(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des zones:', error);
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

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ADMIN_PASSWORD = 'cortiadmin123';
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      setIsAuthenticated(true);
      fetchContests();
      fetchBlocs();
      fetchZones();
      fetchGrimpeurs();
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
    setPassword('');
  };

  const handleToggleContest = async (contestId: number) => {
    const contest = contests.find(c => c.id === contestId);
    if (!contest) return;
    
    try {
      const response = await fetch(`${API_URL}/contests/${contestId}/activate`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        showMessage(contest.actif ? 'Contest désactivé avec succès!' : 'Contest activé avec succès!');
        fetchContests();
        if (onContestChange) {
          onContestChange();
        }
      } else {
        const error = await response.json();
        showMessage(error.error || 'Erreur lors du changement de statut du contest', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleDeleteContest = async (contestId: number) => {
    const contest = contests.find(c => c.id === contestId);
    if (!contest) return;
    
    const shouldDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer le contest "${contest.nom}"? Cette action supprimera également tous les blocs, zones et validations associés et est irréversible.`);
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showMessage('Contest supprimé avec succès!');
        fetchContests();
        fetchBlocs();
        if (onContestChange) {
          onContestChange();
        }
      } else {
        const error = await response.json();
        showMessage(error.error || 'Erreur lors de la suppression du contest', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/contests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContest),
      });
      
      if (response.ok) {
        showMessage('Contest créé avec succès!');
        setNewContest({ nom: '', debut: '', fin: '' });
        fetchContests();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleActivateContest = async (contestId: number) => {
    try {
      const response = await fetch(`${API_URL}/contests/${contestId}/activate`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        showMessage('Contest activé avec succès!');
        fetchContests();
        onContestChange?.();
      } else {
        showMessage('Erreur lors de l\'activation', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleCreateBloc = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = parseInt(newBloc.nombre_blocs);
    
    if (!newBloc.contest_id || isNaN(nombre) || nombre < 1) {
      showMessage('Veuillez sélectionner un contest et entrer un nombre valide', 'error');
      return;
    }

    try {
      // Créer tous les blocs de 1 à N avec leur zone
      const blocsPromises = [];
      for (let i = 1; i <= nombre; i++) {
        // D'abord créer le bloc
        const blocData = {
          contest_id: newBloc.contest_id,
          nom: `Bloc ${i}`,
          description: `Bloc numéro ${i} du contest`
        };
        
        const blocResponse = await fetch(`${API_URL}/blocs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blocData),
        });

        if (blocResponse.ok) {
          const bloc = await blocResponse.json();
          
          // Ensuite créer la zone pour ce bloc
          const zoneData = {
            bloc_id: bloc.id,
            nom: `Zone Bloc ${i}`,
            ordre: 1
          };
          
          blocsPromises.push(
            fetch(`${API_URL}/zones`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(zoneData),
            })
          );
        }
      }

      const results = await Promise.all(blocsPromises);
      const allSuccessful = results.every(response => response.ok);

      if (allSuccessful) {
        showMessage(`${nombre} blocs avec leurs zones créés avec succès!`);
        setNewBloc({ contest_id: '', nombre_blocs: '' });
        fetchBlocs();
      } else {
        showMessage('Erreur lors de la création des blocs/zones', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleResetBlocs = async () => {
    const shouldReset = window.confirm('Êtes-vous sûr de vouloir supprimer tous les blocs et leurs zones? Cette action est irréversible.');
    if (!shouldReset) {
      return;
    }

    try {
      // Supprimer toutes les zones d'abord
      const zonesResponse = await fetch(`${API_URL}/zones`, {
        method: 'DELETE',
      });

      // Supprimer tous les blocs
      const blocsResponse = await fetch(`${API_URL}/blocs`, {
        method: 'DELETE',
      });
      
      if (zonesResponse.ok && blocsResponse.ok) {
        showMessage('Tous les blocs et zones ont été supprimés avec succès!');
        fetchBlocs();
        fetchZones();
      } else {
        showMessage('Erreur lors de la suppression des blocs/zones', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newZone),
      });
      
      if (response.ok) {
        showMessage('Zone créée avec succès!');
        setNewZone({ bloc_id: '', nom: '', ordre: newZone.ordre + 1 });
        fetchZones();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleCreateGrimpeur = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/grimpeurs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGrimpeur),
      });
      
      if (response.ok) {
        showMessage('Participant ajouté avec succès!');
        setNewGrimpeur({ nom: '', prenom: '', categorie: '', sexe: 'homme' });
        fetchGrimpeurs();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Erreur lors de l\'ajout', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleDeleteGrimpeur = async (grimpeurId: number) => {
    const shouldDelete = window.confirm('Êtes-vous sûr de vouloir supprimer ce participant? Cette action est irréversible.');
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/grimpeurs/${grimpeurId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showMessage('Participant supprimé avec succès!');
        fetchGrimpeurs();
      } else {
        showMessage('Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleEditGrimpeur = (grimpeur: any) => {
    setEditingGrimpeur(grimpeur.id);
    setEditGrimpeur({
      nom: grimpeur.nom,
      prenom: grimpeur.prenom,
      categorie: grimpeur.categorie,
      sexe: grimpeur.sexe
    });
  };

  const handleUpdateGrimpeur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrimpeur) return;

    try {
      const response = await fetch(`${API_URL}/grimpeurs/${editingGrimpeur}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGrimpeur),
      });
      
      if (response.ok) {
        showMessage('Participant modifié avec succès!');
        setEditingGrimpeur(null);
        setEditGrimpeur({ nom: '', prenom: '', categorie: '', sexe: 'homme' });
        fetchGrimpeurs();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Erreur lors de la modification', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingGrimpeur(null);
    setEditGrimpeur({ nom: '', prenom: '', categorie: '', sexe: 'homme' });
  };

  const handleEditBloc = (bloc: any) => {
    setEditingBloc(bloc.id);
    setEditBloc({
      nom: bloc.nom,
      description: bloc.description,
      contest_id: bloc.contest_id
    });
  };

  const handleUpdateBloc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBloc) return;

    try {
      const response = await fetch(`${API_URL}/blocs/${editingBloc}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBloc),
      });
      
      if (response.ok) {
        showMessage('Bloc modifié avec succès!');
        setEditingBloc(null);
        setEditBloc({ nom: '', description: '', contest_id: '' });
        fetchBlocs();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Erreur lors de la modification', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleCancelEditBloc = () => {
    setEditingBloc(null);
    setEditBloc({ nom: '', description: '', contest_id: '' });
  };

  const handleEditContest = (contest: any) => {
    setEditingContest(contest.id);
    setEditContest({
      nom: contest.nom,
      debut: new Date(contest.debut).toISOString().slice(0, 16),
      fin: new Date(contest.fin).toISOString().slice(0, 16)
    });
  };

  const handleUpdateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContest) return;

    try {
      const response = await fetch(`${API_URL}/contests/${editingContest}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editContest),
      });
      
      if (response.ok) {
        showMessage('Contest modifié avec succès!');
        setEditingContest(null);
        setEditContest({ nom: '', debut: '', fin: '' });
        fetchContests();
        if (onContestChange) {
          onContestChange();
        }
      } else {
        const error = await response.json();
        showMessage(error.error || 'Erreur lors de la modification', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  const handleCancelEditContest = () => {
    setEditingContest(null);
    setEditContest({ nom: '', debut: '', fin: '' });
  };

  // Fonctions pour la gestion des résultats
  const fetchValidationsForGrimpeur = async (grimpeurId: string) => {
    if (!grimpeurId) return;
    
    try {
      const response = await fetch(`${API_URL}/validations?grimpeur_id=${grimpeurId}`);
      const data = await response.json();
      setValidationsForGrimpeur(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des validations:', error);
    }
  };

  const fetchBlocsWithZones = async () => {
    try {
      const response = await fetch(`${API_URL}/blocs`);
      const blocs = await response.json();
      
      const blocsWithZonesData = await Promise.all(
        blocs.map(async (bloc: any) => {
          const zonesResponse = await fetch(`${API_URL}/zones?bloc_id=${bloc.id}`);
          const zones = await zonesResponse.json();
          return {
            ...bloc,
            zones: zones.sort((a: any, b: any) => a.ordre - b.ordre)
          };
        })
      );
      
      setBlocsWithZones(blocsWithZonesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des blocs:', error);
    }
  };

  const handleGrimpeurForResultsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const grimpeurId = e.target.value;
    setSelectedGrimpeurForResults(grimpeurId);
    fetchValidationsForGrimpeur(grimpeurId);
  };

  const handleToggleValidation = async (zoneId: number, blocId: number, isTop: boolean = false) => {
    if (!selectedGrimpeurForResults) return;

    try {
      // Vérifier si la validation existe déjà
      const existingValidation = validationsForGrimpeur.find(v => 
        isTop ? v.bloc_id === blocId && v.est_top : v.zone_id === zoneId && !v.est_top
      );

      if (existingValidation) {
        // Supprimer la validation
        const response = await fetch(`${API_URL}/validations/${existingValidation.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          showMessage('Validation supprimée avec succès!');
          fetchValidationsForGrimpeur(selectedGrimpeurForResults);
        }
      } else {
        // Ajouter la validation
        const response = await fetch(`${API_URL}/validations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grimpeur_id: selectedGrimpeurForResults,
            zone_id: zoneId,
            bloc_id: blocId,
            est_top: isTop
          }),
        });
        
        if (response.ok) {
          showMessage('Validation ajoutée avec succès!');
          fetchValidationsForGrimpeur(selectedGrimpeurForResults);
        }
      }
    } catch (error) {
      showMessage('Erreur lors de la modification de la validation', 'error');
    }
  };

  const isZoneValidated = (zoneId: number) => {
    return validationsForGrimpeur.some(v => v.zone_id === zoneId && !v.est_top);
  };

  const isTopValidated = (blocId: number) => {
    return validationsForGrimpeur.some(v => v.bloc_id === blocId && v.est_top);
  };

  const handleDeleteBloc = async (blocId: number) => {
    const shouldDelete = window.confirm('Êtes-vous sûr de vouloir supprimer ce bloc? Cette action est irréversible.');
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/blocs/${blocId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showMessage('Bloc supprimé avec succès!');
        fetchBlocs();
      } else {
        showMessage('Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      showMessage('Erreur de connexion', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        padding: '2rem'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(148, 163, 184, 0.1)',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#e71d73', margin: '0 0 1rem 0', fontSize: '1.8rem' }}>
              🔐 Accès Admin
            </h2>
            <p style={{ color: '#475569', margin: '0', fontSize: '1rem', lineHeight: '1.6' }}>
              Veuillez entrer le mot de passe pour accéder à l'administration
            </p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ color: '#e71d73', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  color: '#1f2937'
                }}
                placeholder="Entrez le mot de passe"
                required
              />
            </div>
            
            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '1rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)',
                color: '#1f2937',
                border: '1px solid #94a3b8',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-container">
        <div className="admin-header">
          <h1>🔧 Administration</h1>
          <p>Gérez vos contests, blocs, zones et grimpeurs</p>
          <button 
            onClick={handleLogout}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)',
              color: '#1f2937',
              border: '1px solid #94a3b8',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              zIndex: 1000
            }}
          >
            🚪 Déconnexion
          </button>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'contests' ? 'active' : ''}`}
            onClick={() => setActiveTab('contests')}
          >
            📋 Contests
          </button>
          <button
            className={`tab-button ${activeTab === 'blocs' ? 'active' : ''}`}
            onClick={() => setActiveTab('blocs')}
          >
            🧗 Blocs
          </button>
          <button
            className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            👥 Participants
          </button>
          <button
            className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('results');
              fetchBlocsWithZones();
            }}
          >
            🏆 Résultats
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'contests' && (
            <div className="admin-section">
              {editingContest && (
                <div className="edit-form-container">
                  <h3>Modifier un Contest</h3>
                  <form onSubmit={handleUpdateContest} className="admin-form">
                    <div className="form-group">
                      <label>Nom du contest</label>
                      <input
                        type="text"
                        value={editContest.nom}
                        onChange={(e) => setEditContest({ ...editContest, nom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Date de début</label>
                      <input
                        type="datetime-local"
                        value={editContest.debut}
                        onChange={(e) => setEditContest({ ...editContest, debut: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Date de fin</label>
                      <input
                        type="datetime-local"
                        value={editContest.fin}
                        onChange={(e) => setEditContest({ ...editContest, fin: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-success">
                        ✅ Enregistrer les modifications
                      </button>
                      <button type="button" onClick={handleCancelEditContest} className="btn btn-secondary">
                        ❌ Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <h2>Créer un Contest</h2>
              <form onSubmit={handleCreateContest} className="admin-form">
                <div className="form-group">
                  <label>Nom du contest</label>
                  <input
                    type="text"
                    value={newContest.nom}
                    onChange={(e) => setNewContest({ ...newContest, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date de début</label>
                  <input
                    type="datetime-local"
                    value={newContest.debut}
                    onChange={(e) => setNewContest({ ...newContest, debut: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date de fin</label>
                  <input
                    type="datetime-local"
                    value={newContest.fin}
                    onChange={(e) => setNewContest({ ...newContest, fin: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Créer le contest
                </button>
              </form>

              <h3>Contests existants</h3>
              <div className="contests-list">
                {contests.map((contest) => (
                  <div key={contest.id} className="contest-item">
                    <div className="contest-info">
                      <h4>{contest.nom}</h4>
                      <p>Début: {new Date(contest.debut).toLocaleString()}</p>
                      <p>Fin: {new Date(contest.fin).toLocaleString()}</p>
                      <p>Actif: {contest.actif ? 'Oui' : 'Non'}</p>
                    </div>
                    <div className="contest-actions">
                      <button
                        onClick={() => handleEditContest(contest)}
                        className="btn btn-warning"
                        title="Modifier ce contest"
                      >
                        ✏️ Modifier
                      </button>
                      {!contest.actif && (
                        <button
                          onClick={() => handleToggleContest(contest.id)}
                          className="btn btn-success"
                          title="Activer ce contest"
                        >
                          ✅ Activer
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteContest(contest.id)}
                        className="btn btn-danger"
                        title="Supprimer ce contest"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'blocs' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Créer des Blocs Automatiquement</h2>
                <button
                  onClick={handleResetBlocs}
                  className="btn btn-danger"
                  style={{ marginLeft: '1rem' }}
                >
                  🗑️ Réinitialiser tous les blocs
                </button>
              </div>
              
              <form onSubmit={handleCreateBloc} className="admin-form">
                <div className="form-group">
                  <label>Contest</label>
                  <select
                    value={newBloc.contest_id}
                    onChange={(e) => setNewBloc({ ...newBloc, contest_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un contest</option>
                    {contests.map((contest) => (
                      <option key={contest.id} value={contest.id}>
                        {contest.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nombre de blocs</label>
                  <input
                    type="number"
                    value={newBloc.nombre_blocs}
                    onChange={(e) => setNewBloc({ ...newBloc, nombre_blocs: e.target.value })}
                    min="1"
                    max="50"
                    placeholder="Entrez le nombre de blocs (ex: 8)"
                    required
                  />
                  <small>Les blocs seront créés automatiquement de "Bloc 1" à "Bloc N" avec leur zone</small>
                </div>
                <button type="submit" className="btn btn-primary">
                  Créer les blocs
                </button>
              </form>

              {editingBloc && (
                <div className="edit-form-container">
                  <h3>Modifier un Bloc</h3>
                  <form onSubmit={handleUpdateBloc} className="admin-form">
                    <div className="form-group">
                      <label>Nom du bloc</label>
                      <input
                        type="text"
                        value={editBloc.nom}
                        onChange={(e) => setEditBloc({ ...editBloc, nom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={editBloc.description}
                        onChange={(e) => setEditBloc({ ...editBloc, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Contest</label>
                      <select
                        value={editBloc.contest_id}
                        onChange={(e) => setEditBloc({ ...editBloc, contest_id: e.target.value })}
                        required
                      >
                        <option value="">Sélectionner un contest</option>
                        {contests.map((contest) => (
                          <option key={contest.id} value={contest.id}>
                            {contest.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-success">
                        ✅ Enregistrer les modifications
                      </button>
                      <button type="button" onClick={handleCancelEditBloc} className="btn btn-secondary">
                        ❌ Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <h3>Blocs existants</h3>
              <div className="blocs-list">
                {blocs.map((bloc) => (
                  <div key={bloc.id} className="bloc-item">
                    <div className="bloc-info">
                      <h4>{bloc.nom}</h4>
                      <p>{bloc.description}</p>
                      <small>Contest: {contests.find(c => c.id === bloc.contest_id)?.nom}</small>
                    </div>
                    <div className="bloc-actions">
                      <button
                        onClick={() => handleEditBloc(bloc)}
                        className="btn btn-warning"
                        title="Modifier ce bloc"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteBloc(bloc.id)}
                        className="btn btn-danger"
                        title="Supprimer ce bloc"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="admin-section">
              <h2>Ajouter un Participant</h2>
              <form onSubmit={handleCreateGrimpeur} className="admin-form">
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={newGrimpeur.nom}
                    onChange={(e) => setNewGrimpeur({ ...newGrimpeur, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    value={newGrimpeur.prenom}
                    onChange={(e) => setNewGrimpeur({ ...newGrimpeur, prenom: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Catégorie</label>
                  <select
                    value={newGrimpeur.categorie}
                    onChange={(e) => setNewGrimpeur({ ...newGrimpeur, categorie: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sexe</label>
                  <select
                    value={newGrimpeur.sexe}
                    onChange={(e) => setNewGrimpeur({ ...newGrimpeur, sexe: e.target.value as 'homme' | 'femme' })}
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">
                  Ajouter le participant
                </button>
              </form>

              {editingGrimpeur && (
                <div className="edit-form-container">
                  <h3>Modifier un Participant</h3>
                  <form onSubmit={handleUpdateGrimpeur} className="admin-form">
                    <div className="form-group">
                      <label>Nom</label>
                      <input
                        type="text"
                        value={editGrimpeur.nom}
                        onChange={(e) => setEditGrimpeur({ ...editGrimpeur, nom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Prénom</label>
                      <input
                        type="text"
                        value={editGrimpeur.prenom}
                        onChange={(e) => setEditGrimpeur({ ...editGrimpeur, prenom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Catégorie</label>
                      <select
                        value={editGrimpeur.categorie}
                        onChange={(e) => setEditGrimpeur({ ...editGrimpeur, categorie: e.target.value })}
                        required
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Sexe</label>
                      <select
                        value={editGrimpeur.sexe}
                        onChange={(e) => setEditGrimpeur({ ...editGrimpeur, sexe: e.target.value as 'homme' | 'femme' })}
                        required
                      >
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                      </select>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-success">
                        ✅ Enregistrer les modifications
                      </button>
                      <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                        ❌ Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <h3>Participants existants</h3>
              <div className="participants-list">
                {grimpeurs.map((grimpeur) => (
                  <div key={grimpeur.id} className="participant-item">
                    <div className="participant-info">
                      <h4>{grimpeur.nom} {grimpeur.prenom}</h4>
                      <small>ID: {grimpeur.id}</small>
                      <small>Catégorie: {grimpeur.categorie}</small>
                      <small>Sexe: {grimpeur.sexe}</small>
                    </div>
                    <div className="participant-actions">
                      <button
                        onClick={() => handleEditGrimpeur(grimpeur)}
                        className="btn btn-warning"
                        title="Modifier ce participant"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteGrimpeur(grimpeur.id)}
                        className="btn btn-danger"
                        title="Supprimer ce participant"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="admin-section">
              <h2>Gestion des Résultats des Participants</h2>
              <p className="section-description">
                Modifiez les validations des participants même après la fin du contest.
              </p>
              
              <div className="form-group">
                <label htmlFor="grimpeur-results">Sélectionner un participant:</label>
                <select
                  id="grimpeur-results"
                  value={selectedGrimpeurForResults}
                  onChange={handleGrimpeurForResultsChange}
                >
                  <option value="">Choisir un participant...</option>
                  {grimpeurs.map(grimpeur => (
                    <option key={grimpeur.id} value={grimpeur.id}>
                      {grimpeur.prenom} {grimpeur.nom} - {grimpeur.categorie} - {grimpeur.sexe}
                    </option>
                  ))}
                </select>
              </div>

              {selectedGrimpeurForResults && (
                <div className="grimpeur-results-info">
                  <h3>
                    {grimpeurs.find(g => g.id.toString() === selectedGrimpeurForResults)?.prenom}{' '}
                    {grimpeurs.find(g => g.id.toString() === selectedGrimpeurForResults)?.nom}
                  </h3>
                  <p>
                    Catégorie: {grimpeurs.find(g => g.id.toString() === selectedGrimpeurForResults)?.categorie} | 
                    Sexe: {grimpeurs.find(g => g.id.toString() === selectedGrimpeurForResults)?.sexe}
                  </p>
                </div>
              )}

              {selectedGrimpeurForResults && blocsWithZones.length > 0 && (
                <div className="blocs-results-container">
                  <h4>Validations des blocs</h4>
                  {blocsWithZones.map(bloc => (
                    <div key={bloc.id} className="bloc-result-card">
                      <h5>{bloc.nom}</h5>
                      
                      {bloc.zones.length > 0 && (
                        <div className="zone-result-item">
                          <div className="validation-result-buttons">
                            <button
                              className={`validate-btn zone-btn ${isZoneValidated(bloc.zones[0].id) ? 'validated' : ''}`}
                              onClick={() => handleToggleValidation(bloc.zones[0].id, bloc.id, false)}
                            >
                              {isZoneValidated(bloc.zones[0].id) ? '✓ Zone' : 'Zone'}
                            </button>
                            
                            <button
                              className={`validate-btn bloc-btn ${isTopValidated(bloc.id) ? 'validated' : ''}`}
                              onClick={() => handleToggleValidation(bloc.zones[0].id, bloc.id, true)}
                            >
                              {isTopValidated(bloc.id) ? '🏆 Bloc' : '🏆 Bloc'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedGrimpeurForResults && blocsWithZones.length === 0 && (
                <div className="no-blocs-message">
                  <p>Aucun bloc configuré dans le système.</p>
                </div>
              )}
            </div>
          )}

          {message && (
            <div className={`alert ${messageType === 'error' ? 'alert-danger' : 'alert-success'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
