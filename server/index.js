const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Database setup
const DB_PATH = process.env.DB_PATH || './contest.db';
console.log(`Using database at: ${DB_PATH}`);
const db = new sqlite3.Database(DB_PATH);

// Initialize database tables
db.serialize(() => {
  // Grimpeurs table
  db.run(`CREATE TABLE IF NOT EXISTS grimpeurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    categorie TEXT NOT NULL CHECK (categorie IN ('U11', 'U13', 'U15', 'U19', 'Senior')),
    sexe TEXT NOT NULL CHECK (sexe IN ('femme', 'homme')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Contests table
  db.run(`CREATE TABLE IF NOT EXISTS contests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    debut DATETIME NOT NULL,
    fin DATETIME NOT NULL,
    actif BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Blocs table
  db.run(`CREATE TABLE IF NOT EXISTS blocs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    nom TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests (id)
  )`);

  // Zones table
  db.run(`CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bloc_id INTEGER NOT NULL,
    nom TEXT NOT NULL,
    ordre INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bloc_id) REFERENCES blocs (id)
  )`);

  // Validations table
  db.run(`DROP TABLE IF EXISTS validations`);
  db.run(`CREATE TABLE validations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grimpeur_id INTEGER NOT NULL,
    zone_id INTEGER NOT NULL,
    bloc_id INTEGER NOT NULL,
    est_top BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grimpeur_id) REFERENCES grimpeurs (id),
    FOREIGN KEY (zone_id) REFERENCES zones (id),
    FOREIGN KEY (bloc_id) REFERENCES blocs (id),
    UNIQUE(grimpeur_id, zone_id, bloc_id, est_top)
  )`);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Helper function to emit rankings update
function emitRankingsUpdate() {
  io.emit('rankingsUpdate');
}

// API Routes

// Grimpeurs
app.get('/api/grimpeurs', (req, res) => {
  db.all("SELECT * FROM grimpeurs ORDER BY nom, prenom", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/grimpeurs', (req, res) => {
  const { prenom, nom, categorie, sexe } = req.body;
  
  if (!prenom || !nom || !categorie || !sexe) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }

  db.run(
    "INSERT INTO grimpeurs (prenom, nom, categorie, sexe) VALUES (?, ?, ?, ?)",
    [prenom, nom, categorie, sexe],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, prenom, nom, categorie, sexe });
    }
  );
});

app.delete('/api/grimpeurs/:id', (req, res) => {
  const grimpeurId = req.params.id;
  
  // D'abord supprimer toutes les validations de ce grimpeur
  db.run("DELETE FROM validations WHERE grimpeur_id = ?", [grimpeurId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Ensuite supprimer le grimpeur
    db.run("DELETE FROM grimpeurs WHERE id = ?", [grimpeurId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, message: 'Grimpeur supprimé avec succès' });
      emitRankingsUpdate();
    });
  });
});

app.put('/api/grimpeurs/:id', (req, res) => {
  const grimpeurId = req.params.id;
  const { nom, prenom, categorie, sexe } = req.body;
  
  if (!nom || !prenom || !categorie || !sexe) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }
  
  db.run(
    "UPDATE grimpeurs SET nom = ?, prenom = ?, categorie = ?, sexe = ? WHERE id = ?",
    [nom, prenom, categorie, sexe, grimpeurId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Grimpeur non trouvé' });
        return;
      }
      
      res.json({ success: true, message: 'Grimpeur modifié avec succès' });
      emitRankingsUpdate();
    }
  );
});

// Contests
app.get('/api/contests', (req, res) => {
  db.all("SELECT * FROM contests ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/contests', (req, res) => {
  const { nom, debut, fin } = req.body;
  
  if (!nom || !debut || !fin) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }

  db.run(
    "INSERT INTO contests (nom, debut, fin) VALUES (?, ?, ?)",
    [nom, debut, fin],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, nom, debut, fin, actif: false });
    }
  );
});

app.put('/api/contests/:id', (req, res) => {
  const contestId = req.params.id;
  const { nom, debut, fin } = req.body;
  
  if (!nom || !debut || !fin) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }
  
  db.run(
    "UPDATE contests SET nom = ?, debut = ?, fin = ? WHERE id = ?",
    [nom, debut, fin, contestId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Contest non trouvé' });
        return;
      }
      
      res.json({ success: true, message: 'Contest modifié avec succès' });
    }
  );
});

app.put('/api/contests/:id/activate', (req, res) => {
  const contestId = req.params.id;
  
  // Désactiver tous les contests
  db.run("UPDATE contests SET actif = 0", (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Activer le contest spécifié
    db.run(
      "UPDATE contests SET actif = 1 WHERE id = ?",
      [contestId],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true });
        emitRankingsUpdate();
      }
    );
  });
});

app.put('/api/contests/:id/activate', (req, res) => {
  const contestId = req.params.id;
  
  db.serialize(() => {
    // D'abord vérifier l'état actuel du contest
    db.get("SELECT actif FROM contests WHERE id = ?", [contestId], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (!row) {
        res.status(404).json({ error: 'Contest non trouvé' });
        return;
      }
      
      const currentState = row.actif;
      const newState = currentState === 1 ? 0 : 1; // Bascule l'état
      
      if (newState === 1) {
        // Si on active, désactiver tous les autres contests
        db.run("UPDATE contests SET actif = 0");
      }
      
      // Activer ou désactiver le contest spécifié
      db.run("UPDATE contests SET actif = ? WHERE id = ?", [newState, contestId], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ 
          success: true, 
          message: newState === 1 ? 'Contest activé avec succès!' : 'Contest désactivé avec succès!',
          actif: newState
        });
        emitRankingsUpdate();
      });
    });
  });
});

app.delete('/api/contests/:id', (req, res) => {
  const contestId = req.params.id;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    // Supprimer d'abord les validations liées aux blocs de ce contest
    db.run(`DELETE FROM validations WHERE bloc_id IN (
      SELECT id FROM blocs WHERE contest_id = ?
    )`, [contestId]);
    
    // Supprimer les zones des blocs de ce contest
    db.run(`DELETE FROM zones WHERE bloc_id IN (
      SELECT id FROM blocs WHERE contest_id = ?
    )`, [contestId]);
    
    // Supprimer les blocs de ce contest
    db.run("DELETE FROM blocs WHERE contest_id = ?", [contestId]);
    
    // Supprimer le contest
    db.run("DELETE FROM contests WHERE id = ?", [contestId], function(err) {
      if (err) {
        db.run("ROLLBACK");
        res.status(500).json({ error: err.message });
        return;
      }
      
      db.run("COMMIT");
      res.json({ success: true, message: 'Contest supprimé avec succès' });
      emitRankingsUpdate();
    });
  });
});

// Blocs
app.get('/api/blocs', (req, res) => {
  const contestId = req.query.contest_id;
  let query = "SELECT * FROM blocs";
  let params = [];
  
  if (contestId) {
    query += " WHERE contest_id = ?";
    params.push(contestId);
  }
  
  query += " ORDER BY created_at";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/blocs', (req, res) => {
  const { contest_id, nom, description } = req.body;
  
  if (!contest_id || !nom) {
    return res.status(400).json({ error: 'contest_id et nom sont obligatoires' });
  }

  db.run(
    "INSERT INTO blocs (contest_id, nom, description) VALUES (?, ?, ?)",
    [contest_id, nom, description],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, contest_id, nom, description });
    }
  );
});

app.put('/api/blocs/:id', (req, res) => {
  const blocId = req.params.id;
  const { contest_id, nom, description } = req.body;
  
  if (!contest_id || !nom) {
    return res.status(400).json({ error: 'contest_id et nom sont obligatoires' });
  }
  
  db.run(
    "UPDATE blocs SET contest_id = ?, nom = ?, description = ? WHERE id = ?",
    [contest_id, nom, description, blocId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Bloc non trouvé' });
        return;
      }
      
      res.json({ success: true, message: 'Bloc modifié avec succès' });
    }
  );
});

app.delete('/api/blocs/:id', (req, res) => {
  const blocId = req.params.id;
  
  if (!blocId) {
    return res.status(400).json({ error: 'ID du bloc requis' });
  }
  
  db.serialize(() => {
    // D'abord supprimer les validations associées à ce bloc
    db.run("DELETE FROM validations WHERE bloc_id = ?", [blocId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Ensuite supprimer les zones associées à ce bloc
      db.run("DELETE FROM zones WHERE bloc_id = ?", [blocId], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Enfin supprimer le bloc
        db.run("DELETE FROM blocs WHERE id = ?", [blocId], function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          if (this.changes === 0) {
            res.status(404).json({ error: 'Bloc non trouvé' });
            return;
          }
          
          res.json({ success: true, message: 'Bloc supprimé avec succès' });
        });
      });
    });
  });
});

// Zones
app.get('/api/zones', (req, res) => {
  const blocId = req.query.bloc_id;
  let query = `
    SELECT z.*, b.nom as bloc_nom 
    FROM zones z 
    JOIN blocs b ON z.bloc_id = b.id
  `;
  let params = [];
  
  if (blocId) {
    query += " WHERE z.bloc_id = ?";
    params.push(blocId);
  }
  
  query += " ORDER BY z.bloc_id, z.ordre";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/zones', (req, res) => {
  const { bloc_id, nom, ordre } = req.body;
  
  if (!bloc_id || !nom || ordre === undefined) {
    return res.status(400).json({ error: 'bloc_id, nom et ordre sont obligatoires' });
  }

  db.run(
    "INSERT INTO zones (bloc_id, nom, ordre) VALUES (?, ?, ?)",
    [bloc_id, nom, ordre],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, bloc_id, nom, ordre });
    }
  );
});

// Validations
app.post('/api/validations', (req, res) => {
  const { grimpeur_id, zone_id, bloc_id, est_top } = req.body;
  
  if (!grimpeur_id || !zone_id || !bloc_id) {
    return res.status(400).json({ error: 'grimpeur_id, zone_id et bloc_id sont obligatoires' });
  }

  // Vérifier si une validation existe déjà pour ce grimpeur, cette zone et ce type
  db.get(
    "SELECT id FROM validations WHERE grimpeur_id = ? AND zone_id = ? AND est_top = ?",
    [grimpeur_id, zone_id, est_top || 0],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (row) {
        // La validation existe déjà, retourner une erreur
        return res.status(409).json({ error: 'Validation déjà existante' });
      }
      
      // Insérer la nouvelle validation
      db.run(
        "INSERT INTO validations (grimpeur_id, zone_id, bloc_id, est_top) VALUES (?, ?, ?, ?)",
        [grimpeur_id, zone_id, bloc_id, est_top || 0],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ id: this.lastID, grimpeur_id, zone_id, bloc_id, est_top });
          emitRankingsUpdate();
        }
      );
    }
  );
});

app.get('/api/validations', (req, res) => {
  const grimpeurId = req.query.grimpeur_id;
  let query = `
    SELECT v.*, g.prenom, g.nom, g.categorie, g.sexe, z.nom as zone_nom, b.nom as bloc_nom
    FROM validations v
    JOIN grimpeurs g ON v.grimpeur_id = g.id
    JOIN zones z ON v.zone_id = z.id
    JOIN blocs b ON v.bloc_id = b.id
  `;
  let params = [];
  
  if (grimpeurId) {
    query += " WHERE v.grimpeur_id = ?";
    params.push(grimpeurId);
  }
  
  query += " ORDER BY v.created_at DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Supprimer des validations
app.delete('/api/validations', (req, res) => {
  const { grimpeur_id, zone_id, bloc_id, est_top } = req.query;
  
  // Vérifier que le grimpeur_id est fourni
  if (!grimpeur_id) {
    return res.status(400).json({ error: 'grimpeur_id est obligatoire' });
  }
  
  let query = "DELETE FROM validations WHERE grimpeur_id = ?";
  let params = [grimpeur_id];
  
  if (zone_id) {
    query += " AND zone_id = ?";
    params.push(zone_id);
  }
  
  if (bloc_id) {
    query += " AND bloc_id = ?";
    params.push(bloc_id);
  }
  
  if (est_top) {
    query += " AND est_top = ?";
    params.push(est_top);
  }
  
  db.run(query, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, message: 'Validations supprimées avec succès' });
    emitRankingsUpdate();
  });
});

// Renommer les zones
app.put('/api/zones/rename', (req, res) => {
  const { old_name, new_name } = req.body;
  
  db.run("UPDATE zones SET nom = ? WHERE nom = ?", [new_name, old_name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, message: `${this.changes} zone(s) renommée(s)` });
  });
});

// Rankings
app.get('/api/rankings', (req, res) => {
  const categorie = req.query.categorie;
  const sexe = req.query.sexe;
  
  let query = `
    SELECT 
      g.id,
      g.prenom,
      g.nom,
      g.categorie,
      g.sexe,
      COUNT(DISTINCT v.zone_id) as zones_valides,
      SUM(CASE WHEN v.est_top = 1 THEN 1 ELSE 0 END) as tops_valides,
      ROUND(SUM(
        CASE 
          WHEN v.est_top = 1 THEN 1000.0 / (SELECT COUNT(*) FROM validations v2 WHERE v2.zone_id = v.zone_id AND v2.est_top = 1)
          ELSE 1000.0 / (SELECT COUNT(*) FROM validations v2 WHERE v2.zone_id = v.zone_id AND v2.est_top = 0)
        END
      ), 2) as score_total
    FROM grimpeurs g
    LEFT JOIN validations v ON g.id = v.grimpeur_id
    WHERE 1=1
  `;
  
  let params = [];
  
  if (categorie) {
    query += " AND g.categorie = ?";
    params.push(categorie);
  }
  
  if (sexe) {
    query += " AND g.sexe = ?";
    params.push(sexe);
  }
  
  query += `
    GROUP BY g.id, g.prenom, g.nom, g.categorie, g.sexe
    ORDER BY score_total DESC, zones_valides DESC, tops_valides DESC, g.nom, g.prenom
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Active contest
app.get('/api/contest/active', (req, res) => {
  db.get("SELECT * FROM contests WHERE actif = 1", (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row || null);
  });
});

// Delete all zones
app.delete('/api/zones', (req, res) => {
  db.serialize(() => {
    // D'abord supprimer les validations liées aux zones
    db.run("DELETE FROM validations", function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Ensuite supprimer toutes les zones
      db.run("DELETE FROM zones", function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true, message: 'Toutes les zones ont été supprimées' });
        emitRankingsUpdate();
      });
    });
  });
});

// Delete all blocs
app.delete('/api/blocs', (req, res) => {
  db.serialize(() => {
    // D'abord supprimer toutes les validations
    db.run("DELETE FROM validations", function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Ensuite supprimer toutes les zones
      db.run("DELETE FROM zones", function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Enfin supprimer tous les blocs
        db.run("DELETE FROM blocs", function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ success: true, message: 'Tous les blocs et zones ont été supprimés' });
          emitRankingsUpdate();
        });
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
