
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
    driverId: String
    driver: User
    image: String
    registrationCardImage: String
    rapports: [Rapport]
  }

  type Organization {
    id: String
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
    telephone: String
    licenseNumber: String
    organizationId: String
    organizationAccess: Boolean
    organization: Organization
    vehicules: [Vehicule]
    image: String
    licenseExpiryDate: String
    licenseImage: String
    createdAt: String
  }

  type Chauffeur {
    id: ID
    name: String
    email: String
    password: String
    telephone: String
    licenseNumber: String
    role: Role
    organizationAccess: Boolean
    statut: Boolean
    createdAt: String
    image: String
    licenseExpiryDate: String
    licenseImage: String
    vehicules: [Vehicule]
    rapports: [Rapport]
  }

  enum Role {
    ADMIN
    GESTIONNAIRE
    CHAUFFEUR
  }

  type AuthPayload {
    token: String
    user: User
  }

  enum Folder {
    profil
    vehicule
    permis
  }

  type Rapport {
    id: Int
    date: String
    kilometrage: Int
    incidents: String
    commentaires: String
    user: User
    vehicule: Vehicule
    chauffeur: Chauffeur
    organizationId: String
    organization: Organization
    createdAt: String
  }

  type SearchResult {
    chauffeurs: [Chauffeur!]!
    vehicules: [Vehicule!]!
    rapports: [Rapport!]!
  }

  

  type Query {
    chauffeurs: [Chauffeur!]!
    chauffeur(id: ID!): Chauffeur!
    countChauffeur(organizationId: String): Int!
    
    vehicules: [Vehicule!]!
    vehicule(id: Int!): Vehicule!
    countVehicule(organizationId: String): Int!
    countActiveVehicule(organizationId: String): Int!
    countIndisponibleVehicule(organizationId: String): Int!

    rapports: [Rapport!]!
    rapport(id: Int!): Rapport!
    countRapport(organizationId: String): Int!

    users: [User!]!
    user(id: String!): User!

    getOrganizationUser(userId: String!): Organization
    organizationMembers(organizationId: String!): [User!]!
    search(query: String!, organizationId: String): SearchResult!
    notifications: [Notification!]!
  }



  type Mutation {

    login(email: String!, password: String!): AuthPayload!
    loginWithPhone(telephone: String!, password: String!): AuthPayload!
    generateToken(userId: String!): AuthPayload!
    register(name: String!, email: String!, password: String!,role: String!): AuthPayload!  
    registerWithPhone(name: String!, telephone: String!, password: String!, role: String!): AuthPayload!
    changePassword(id: String!, password: String!): User!
    forgotPassword(email: String!): Boolean!
    forgotPasswordWithPhone(telephone: String!): Boolean!
    logout(token: String!): Boolean!
    updateProfile(id: String!, name: String!, email: String!, password: String!, role: Role!, image: String, telephone: String, licenseNumber: String): User!
    
    markNotificationAsRead(id: ID!): Notification!
    markAllNotificationsAsRead: Boolean!
    

    createVehicule(immatriculation: String!, marque: String!, modele: String!, annee: Int!, userId: String!, driverId: String, image: String, registrationCardImage: String): Vehicule!
    updateVehicule(id: Int!, immatriculation: String!, marque: String!, modele: String!, annee: Int!, statut: String!): Vehicule!
    deleteVehicule(id: Int!): Boolean!
    changeStatut(id: Int!, statut: String!): Vehicule!
    

    createUser(name: String!, email: String!, password: String!, role: Role!, telephone: String, licenseNumber: String): User!
    updateUser(id: String!, name: String!, email: String!, password: String!, role: Role!): User!
    deleteUser(id: String!): Boolean!
    
    createOrganization(name: String!, userId: String): Organization!
    addUserToOrganization(email: String!, organizationId: String!, telephone: String!): User!
    manageOrganizationAccess(userId: String!, access: Boolean!): User!
    
    createChauffeur(name: String!, email: String, password: String!, role: Role!, telephone: String, licenseNumber: String, licenseExpiryDate: String, licenseImage: String, organizationId: String, image: String): User!
    updateChauffeur(id: ID!, name: String, email: String, password: String, role: Role, telephone: String, licenseNumber: String, licenseExpiryDate: String, licenseImage: String, organizationId: String, image: String): User!
    deleteChauffeur(id: String!): Boolean!
    bloqueAccess(id: String!): Boolean!

    createRapport(date: String, kilometrage: Int!, incidents: String, commentaires: String, chauffeurId: String!, vehiculeId: Int!): Rapport!
    updateRapport(id: Int!, date: String, kilometrage: Int, incidents: String, commentaires: String, chauffeurId: String, vehiculeId: Int): Rapport!
    deleteRapport(id: Int!): Boolean!
  
    sendNotification(message: String!): Notification!
    
    uploadFile(file: Upload!, folder: Folder!): String!
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
