import { resolvers } from '@/graphql/resolvers';

/**
 * Mock PubSub for testing subscriptions
 */
class MockPubSub {
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  subscribe(eventName: string) {
    const listeners: ((data: any) => void)[] = [];
    
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    
    const subscriberSet = this.subscribers.get(eventName)!;
    
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => {
          return new Promise((resolve) => {
            const listener = (data: any) => {
              resolve({ value: data, done: false });
            };
            listeners.push(listener);
            subscriberSet.add(listener);
          });
        },
        return: () => {
          listeners.forEach(listener => subscriberSet.delete(listener));
          return Promise.resolve({ value: undefined, done: true });
        },
      }),
    };
  }

  publish(eventName: string, payload: any) {
    const subscribers = this.subscribers.get(eventName);
    if (subscribers) {
      subscribers.forEach(callback => callback(payload));
    }
  }
}

describe('GraphQL Subscriptions', () => {
  let mockPubSub: MockPubSub;
  let mockContext: any;

  beforeEach(() => {
    mockPubSub = new MockPubSub();
    mockContext = {
      pubsub: mockPubSub,
      user: {
        id: 'test-user-id',
        role: 'GESTIONNAIRE',
        organizationId: 'test-org-id',
      },
    };
  });

  describe('rapportCreated Subscription', () => {
    it('should subscribe to RAPPORT_CREATED event', async () => {
      const subscription = resolvers.Subscription.rapportCreated.subscribe(
        {},
        {},
        mockContext
      );

      expect(subscription).toBeDefined();
      expect(subscription[Symbol.asyncIterator]).toBeDefined();
    });

    it('should resolve rapportCreated payload correctly', () => {
      const mockRapport = {
        id: 1,
        date: '2026-02-09',
        kilometrage: 15000,
        incidents: 'Aucun',
        commentaires: 'Tout va bien',
        type: 'MAINTENANCE',
        chauffeurId: 'chauffeur-1',
        vehiculeId: 1,
        organizationId: 'test-org-id',
      };

      const payload = { rapportCreated: mockRapport };
      const result = resolvers.Subscription.rapportCreated.resolve(payload);

      expect(result).toEqual(mockRapport);
    });

    it('should receive data when rapport is created', async () => {
      const subscription = resolvers.Subscription.rapportCreated.subscribe(
        {},
        {},
        mockContext
      );

      const iterator = subscription[Symbol.asyncIterator]();

      const mockRapport = {
        id: 1,
        date: '2026-02-09',
        kilometrage: 15000,
        incidents: 'Aucun',
        commentaires: 'Test rapport',
        type: 'INSPECTION',
        chauffeurId: 'chauffeur-1',
        vehiculeId: 1,
        organizationId: 'test-org-id',
      };

      // Simulate publishing the event
      setTimeout(() => {
        mockPubSub.publish('RAPPORT_CREATED', { rapportCreated: mockRapport });
      }, 100);

      const result = await iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toEqual({ rapportCreated: mockRapport });
    });
  });

  describe('vehiculeCreated Subscription', () => {
    it('should subscribe to VEHICULE_CREATED event', async () => {
      const subscription = resolvers.Subscription.vehiculeCreated.subscribe(
        {},
        {},
        mockContext
      );

      expect(subscription).toBeDefined();
      expect(subscription[Symbol.asyncIterator]).toBeDefined();
    });

    it('should resolve vehiculeCreated payload correctly', () => {
      const mockVehicule = {
        id: 1,
        immatriculation: 'ABC-123',
        marque: 'Toyota',
        modele: 'Camry',
        annee: 2023,
        statut: 'Disponible',
        userId: 'user-1',
        driverId: 'driver-1',
      };

      const payload = { vehiculeCreated: mockVehicule };
      const result = resolvers.Subscription.vehiculeCreated.resolve(payload);

      expect(result).toEqual(mockVehicule);
    });

    it('should receive data when vehicule is created', async () => {
      const subscription = resolvers.Subscription.vehiculeCreated.subscribe(
        {},
        {},
        mockContext
      );

      const iterator = subscription[Symbol.asyncIterator]();

      const mockVehicule = {
        id: 1,
        immatriculation: 'XYZ-789',
        marque: 'Honda',
        modele: 'Civic',
        annee: 2024,
        statut: 'Disponible',
      };

      setTimeout(() => {
        mockPubSub.publish('VEHICULE_CREATED', { vehiculeCreated: mockVehicule });
      }, 100);

      const result = await iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toEqual({ vehiculeCreated: mockVehicule });
    });
  });

  describe('vehiculeUpdated Subscription', () => {
    it('should subscribe to VEHICULE_UPDATED event', async () => {
      const subscription = resolvers.Subscription.vehiculeUpdated.subscribe(
        {},
        {},
        mockContext
      );

      expect(subscription).toBeDefined();
      expect(subscription[Symbol.asyncIterator]).toBeDefined();
    });

    it('should resolve vehiculeUpdated payload correctly', () => {
      const mockVehicule = {
        id: 1,
        immatriculation: 'ABC-123',
        marque: 'Toyota',
        modele: 'Camry',
        annee: 2023,
        statut: 'En maintenance',
      };

      const payload = { vehiculeUpdated: mockVehicule };
      const result = resolvers.Subscription.vehiculeUpdated.resolve(payload);

      expect(result).toEqual(mockVehicule);
    });

    it('should receive data when vehicule status is updated', async () => {
      const subscription = resolvers.Subscription.vehiculeUpdated.subscribe(
        {},
        {},
        mockContext
      );

      const iterator = subscription[Symbol.asyncIterator]();

      const mockVehicule = {
        id: 1,
        statut: 'Indisponible',
      };

      setTimeout(() => {
        mockPubSub.publish('VEHICULE_UPDATED', { vehiculeUpdated: mockVehicule });
      }, 100);

      const result = await iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toEqual({ vehiculeUpdated: mockVehicule });
    });
  });

  describe('notificationReceived Subscription', () => {
    it('should subscribe to NOTIFICATION_RECEIVED event', async () => {
      const subscription = resolvers.Subscription.notificationReceived.subscribe(
        {},
        {},
        mockContext
      );

      expect(subscription).toBeDefined();
      expect(subscription[Symbol.asyncIterator]).toBeDefined();
    });

    it('should resolve notificationReceived payload correctly', () => {
      const mockNotification = {
        id: '1',
        message: 'Nouveau rapport créé',
        read: false,
        createdAt: '2026-02-09T20:00:00Z',
      };

      const payload = { notificationReceived: mockNotification };
      const result = resolvers.Subscription.notificationReceived.resolve(payload);

      expect(result).toEqual(mockNotification);
    });

    it('should receive data when notification is sent', async () => {
      const subscription = resolvers.Subscription.notificationReceived.subscribe(
        {},
        {},
        mockContext
      );

      const iterator = subscription[Symbol.asyncIterator]();

      const mockNotification = {
        id: '1',
        message: 'Nouveau véhicule ajouté',
        read: false,
        createdAt: new Date().toISOString(),
      };

      setTimeout(() => {
        mockPubSub.publish('NOTIFICATION_RECEIVED', { notificationReceived: mockNotification });
      }, 100);

      const result = await iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toEqual({ notificationReceived: mockNotification });
    });
  });

  describe('statsUpdated Subscription', () => {
    it('should subscribe to STATS_UPDATED event', async () => {
      const subscription = resolvers.Subscription.statsUpdated.subscribe(
        {},
        {},
        mockContext
      );

      expect(subscription).toBeDefined();
      expect(subscription[Symbol.asyncIterator]).toBeDefined();
    });

    it('should resolve statsUpdated payload correctly', () => {
      const payload = { statsUpdated: true };
      const result = resolvers.Subscription.statsUpdated.resolve(payload);

      expect(result).toBe(true);
    });

    it('should receive data when stats are updated', async () => {
      const subscription = resolvers.Subscription.statsUpdated.subscribe(
        {},
        {},
        mockContext
      );

      const iterator = subscription[Symbol.asyncIterator]();

      setTimeout(() => {
        mockPubSub.publish('STATS_UPDATED', { statsUpdated: true });
      }, 100);

      const result = await iterator.next();
      expect(result.done).toBe(false);
      expect(result.value).toEqual({ statsUpdated: true });
    });
  });

  describe('Subscription Cleanup', () => {
    it('should properly cleanup subscription when iterator is returned', async () => {
      const subscription = resolvers.Subscription.rapportCreated.subscribe(
        {},
        {},
        mockContext
      );

      const iterator = subscription[Symbol.asyncIterator]();
      
      // Clean up the subscription
      const returnResult = await iterator.return?.();
      
      expect(returnResult?.done).toBe(true);
    });
  });
});
