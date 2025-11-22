export type Rapport = {
  id: number;
  date: string;
  kilometrage: number;
  incidents: string;
  commentaires: string;
  chauffeur: Chauffeur;
  vehicule: Vehicule;
};
export type Chauffeur = {
  id: number;
  nom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  permis: string; 
  statut: boolean;
  createdAt: string;
  user: User; 
  vehicules: Vehicule[];
  rapports: Rapport[];
  chauffeurs: Chauffeur[];
};

export type Vehicule = {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  statut: string;
  user: User;
  chauffeurs: Chauffeur[];
  rapports: Rapport[];
};

export type User = {
  id: number;
  nom: string;
  email: string;
  password: string;
  role: string;
  chauffeurs: Chauffeur[];
  vehicules: Vehicule[];
  createdAt: string;
};