import { prisma } from '@/lib/prisma';

export const NotificationController = {
  create: async (userId: string, message: string) => {
    return await prisma.notification.create({
      data: {
        userId,
        message,
        read: false,
      },
    });
  },

  createForOrganization: async (organizationId: string, message: string) => {
    // Find all managers (GESTIONNAIRE) in the organization
    const managers = await prisma.user.findMany({
      where: {
        organizationId,
        role: 'GESTIONNAIRE',
      },
    });

    // Create notifications for each manager
    const notifications = await Promise.all(
      managers.map((manager) =>
        prisma.notification.create({
          data: {
            userId: manager.id,
            message,
            read: false,
          },
        })
      )
    );

    return notifications;
  },

  getUserNotifications: async (userId: string) => {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  markAsRead: async (id: string, userId: string) => {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Not authorized');
    }

    return await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  },
  
  markAllAsRead: async (userId: string) => {
      return await prisma.notification.updateMany({
          where: { userId, read: false },
          data: { read: true }
      });
  }
};
