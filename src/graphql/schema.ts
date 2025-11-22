


export const typeDefs = `#graphql

  scalar Upload

  type Vehicule {
    id: Int
    immatriculation: String
    marque: String
    modele: String
    annee: Int
    statut: String
    user: User
    rapports: [Rapport]
  }

  type Organization {
    id: Int
    name: String
    createdAt: String
    users: [User]
  }

  type User {
    id: ID
    name: String
    email: String
    password: String
    role: Role
    vehicules: [Vehicule]
    createdAt: String
  }

  type Chauffeur {
    id: ID
    name: String
    email: String
    motDePasse: String
    telephone: String
    permis: String
    statut: Boolean
    createdAt: String
    user: User
    vehicules: [Vehicule]
    rapports: [Rapport]
  }

  enum Role {
    GESTIONNAIRE
    CHAUFFEUR
  }

  type AuthPayload {
    token: String
    user: User
  }

  type Rapport {
    id: Int
    date: String
    kilometrage: Int
    incidents: String
    commentaires: String
    user: User
    vehicule: Vehicule
  }

  

  type Query {
    chauffeurs: [Chauffeur!]!
    chauffeur(id: ID!): Chauffeur!
    countChauffeur: Int!


    vehicules: [Vehicule!]!
    vehicule(id: Int!): Vehicule!
    countVehicule: Int!

    rapports: [Rapport!]!
    rapport(id: Int!): Rapport!
    countRapport: Int!

    users: [User!]!
    user(id: ID!): User!
  }



  type Mutation {

    login(email: String!, password: String!): AuthPayload!
    generateToken(userId: String!): AuthPayload!
    register(name: String!, email: String!, password: String!,role: String!): AuthPayload!  
    forgotPassword(email: String!): Boolean!
    logout(token: String!): Boolean!
    

    createVehicule(immatriculation: String!, marque: String!, modele: String!, annee: Int!, userId: String!): Vehicule!
    updateVehicule(id: Int!, immatriculation: String!, marque: String!, modele: String!, annee: Int!, statut: String!): Vehicule!
    deleteVehicule(id: Int!): Boolean!
    

    createUser(name: String!, email: String!, password: String!, role: Role!): User!
    updateUser(id: String!, name: String!, email: String!, password: String!, role: Role!): User!
    deleteUser(id: String!): Boolean!
    
    createOrganization(name: String!, userId: String): Organization!
    

    createRapport(date: String, kilometrage: Int!, incidents: String, commentaires: String, chauffeurId: Int!, vehiculeId: Int!): Rapport!
    updateRapport(id: Int!, date: String, kilometrage: Int, incidents: String, commentaires: String, chauffeurId: Int, vehiculeId: Int): Rapport!
    deleteRapport(id: Int!): Boolean!
  

    updateChauffeur(id: String!, name: String, email: String, password: String, telephone: String, tarifKm: Int, tarifHeure: Int): User!
    deleteChauffeur(id: String!): Boolean!

    sendNotification(message: String!): Notification!

  }

  type Notification {
    id: ID!
    message: String!
    read: Boolean!
  }

  type Subscription {
    notificationReceived: Notification
  }
`;
