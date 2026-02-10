import { cors } from '@elysiajs/cors'
import { yoga } from '@elysiajs/graphql-yoga'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { Elysia, t } from 'elysia'
import { createPubSub } from 'graphql-yoga'

import { resolvers } from '@/graphql/resolvers'
import { typeDefs } from '@/graphql/schema'
import { exportRapportsExcel } from '@/lib/excel'
import log from '@/lib/log'
import { prisma } from '@/lib/prisma'
import { saveFile } from '@/lib/saveImage'
import { checkAuth, checkOrganization, verifyToken } from '@/utils/auth'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)





// ✅ PubSub pour les subscriptions
const pubsub = createPubSub()

// ✅ Construire le schéma GraphQL
const schema = makeExecutableSchema({ typeDefs, resolvers })

// ✅ Création du serveur Elysia + Yoga
const app = new Elysia()

  // Middleware CORS (simple)
  .use(cors({
    origin: '*',       // autorise toutes les origines
    credentials: true, // autorise les cookies/headers d’auth
  }))
  // Static files (équivalent de express.static)
  .get('/media/*', ({ request }: any) => {
    const url = request.url || ''
    const filePath = path.join(__dirname, '../media', url.split('/media/')[1] || '')
    return Bun.file(filePath)
  })
  // Middleware de logging pour toutes les requêtes
  .onRequest(({ request }) => {
    const timestamp = new Date().toLocaleTimeString("fr-FR");
    const url = new URL(request.url);

    // Identification de la source
    const ip =
      request.headers.get("x-forwarded-for") || // utile derrière un proxy
      request.headers.get("cf-connecting-ip") || // Cloudflare
      request.headers.get("x-real-ip") || // Nginx
      "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    log(
      `\n[${timestamp}] 📥 ${request.method} ${url.pathname}`,
      `🌐 IP: ${ip}`,
      `🖥️ UA: ${userAgent}`
    );
  })
  // ✅ Ajouter le user au contexte de toutes les requêtes
  .derive(async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = token ? await verifyToken(token) : null;
    return { user };
  })
  // ✅ Routes REST pour les images (Elysia)
  .group('/api/images', (app) => 
    app
      .post('/upload-multiple', async (context) => {
        checkAuth(context)
        log("upload multiple")

        const { body, user } = context;
        const { files, folder: requestedFolder, id, type } = body;
        const uploadedUrls: string[] = [];

        // 🟢 Détermination dynamique du dossier
        let targetFolder = requestedFolder || `others`;

        if (type === 'profil') {
          // Si c'est un profil, on utilise l'ID de l'utilisateur concerné ou celui de la session
          const userId = id || user?.id;
          if (userId) targetFolder = `profil/${userId}`;
        } else if (type === 'rapport' && id) {
          const rapport = await prisma.rapport.findUnique({
            where: { id: parseInt(id) },
            select: { organizationId: true }
          });
          if (rapport?.organizationId) {
            targetFolder = `rapport/${rapport.organizationId}`;
          } else if (user?.organizationId) {
            targetFolder = `rapport/${user.organizationId}`;
          }
        } else if (type === 'vehicule' && id) {
          const vehicule = await prisma.vehicule.findUnique({
            where: { id: parseInt(id) },
            select: { organizationId: true }
          });
          if (vehicule?.organizationId) {
            targetFolder = `vehicule/${vehicule.organizationId}`;
          } else if (user?.organizationId) {
            targetFolder = `vehicule/${user.organizationId}`;
          }
        } else if (user?.organizationId) {
          // Par défaut, si on a une organisation, on peut ranger par type/org
          targetFolder = `${type}/${user.organizationId}`;
        }

        // Si c'est un seul fichier, Elysia ne le met pas dans un tableau
        const fileList = Array.isArray(files) ? files : [files];

        for (const file of fileList) {
          const url = await saveFile(file, targetFolder);
          uploadedUrls.push(url);

          // Enregistrement en base de données si ID fourni
          if (id && type === 'vehicule') {
            await prisma.vehiculeImage.create({
              data: { url, vehiculeId: parseInt(id) }
            });
          } else if (id && type === 'rapport') {
            await prisma.rapportImage.create({
              data: { url, rapportId: parseInt(id) }
            });
          }
        }

        return { success: true, urls: uploadedUrls, folder: targetFolder };
      }, {
        body: t.Object({
          files: t.Files(),
          type: t.String(), // 'vehicule', 'rapport', 'profil'
          id: t.Optional(t.String()), // ID de l'entité
          folder: t.Optional(t.String())
        })
      })
  )
  // ✅ Routes REST pour les rapports (Excel Export)
  .group('/api/reports', (app) =>
    app.get('/export', async (context) => {
      checkAuth(context);
      checkOrganization(context);

      const organizationId = context.user?.organizationId;
      if (!organizationId) throw new Error("ID Organisation manquant");

      const buffer = await exportRapportsExcel(organizationId);

      context.set.headers['content-type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      context.set.headers['content-disposition'] = `attachment; filename="rapports-flotte-${organizationId}.xlsx"`;

      return buffer;
    })
  )
  // GraphQL Yoga avec contexte et subscriptions
  .use(
    yoga({
      schema,
      context: async ({ request }) => {
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        log('🔵 GraphQL Request Context');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        log(`🔑 Token: ${token ? token.substring(0, 20) + '...' : 'None'}`);

        const user = token ? await verifyToken(token) : null;
        log(`👤 User: ${user ? `${user.name} (${user.role})` : 'Anonymous'}`);
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return { user, pubsub, request };

      },
    })
  )
  .listen({ port: 4001, hostname: '0.0.0.0' }, (server: any) => {
    log('')
    log(`🚀 Server ready at http://localhost:${server.port}/graphql`)
    log(`📡 Subscriptions ready at ws://localhost:${server.port}/graphql`)
    log(`🚀 Server ready at http://${server.hostname}:${server.port}/graphql`)
    log(`📡 Subscriptions ready at ws://${server.hostname}:${server.port}/graphql`)
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  })