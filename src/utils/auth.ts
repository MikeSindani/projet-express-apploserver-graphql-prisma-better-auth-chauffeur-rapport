import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiaWF0IjoxNzYzMjEzNzM5LCJleHAiOjE3NjMyMTczMzl9.ZPoFx-hJNtG-nCgDKE6kDULFn2yQbrGytS0C1ACGiZk";

/**
 * @brief Vérifie un jeton JWT et récupère l'utilisateur associé.
 *
 * Cette fonction prend un jeton JWT en entrée et effectue les étapes suivantes :
 * 1. Elle tente de vérifier la validité du `token` en utilisant la clé secrète `JWT_SECRET`.
 *    Si la vérification réussit, elle extrait le `payload` du jeton, qui est typé pour contenir un `userId`.
 * 2. Avec le `userId` extrait, elle recherche un utilisateur correspondant dans la base de données via `prisma.user.findUnique`.
 * 3. Si un utilisateur est trouvé, l'objet utilisateur est retourné.
 * 4. En cas d'échec de la vérification du jeton (par exemple, jeton expiré, modifié ou signature invalide)
 *    ou si aucun utilisateur n'est trouvé pour le `userId` donné, la fonction capture l'erreur et retourne `null`.
 *    Cela garantit que la création du contexte reste sécurisée et ne lève pas d'exception.
 *
 * @param token Le jeton JWT à vérifier.
 * @returns L'objet utilisateur si le jeton est valide et l'utilisateur existe, sinon `null`.
 */
export const verifyToken = async (token: string) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) return null;
    
    return payload ? user : null;
  } catch (error) {
    // invalid token -> return null so context creation stays safe
    return null;
  }
};

export const generateToken = async (userId: string) => {
  if (!userId) throw new Error("User ID is required");

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

  return { token, user: await prisma.user.findUnique({ where: { id: userId } }) } as any;
};