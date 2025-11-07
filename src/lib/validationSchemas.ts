import { z } from 'zod';

// Note validation schema
export const noteSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "Le titre ne peut pas être vide" })
    .max(200, { message: "Le titre ne peut pas dépasser 200 caractères" }),
  content: z.string()
    .trim()
    .min(1, { message: "Le contenu ne peut pas être vide" })
    .max(5000, { message: "Le contenu ne peut pas dépasser 5000 caractères" }),
  isPrivate: z.boolean()
});

// Tag validation schema
export const tagSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Le nom du tag ne peut pas être vide" })
    .max(50, { message: "Le nom du tag ne peut pas dépasser 50 caractères" }),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, { message: "La couleur doit être au format hexadécimal valide" })
});

// User management validation schemas (for edge function)
export const userEmailSchema = z.string()
  .trim()
  .email({ message: "Email invalide" })
  .max(255, { message: "L'email ne peut pas dépasser 255 caractères" });

export const userPasswordSchema = z.string()
  .min(12, { message: "Le mot de passe doit contenir au moins 12 caractères" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial"
  });

export const userRoleSchema = z.enum(['admin', 'analyste', 'lecteur'], {
  errorMap: () => ({ message: "Le rôle doit être 'admin', 'analyste' ou 'lecteur'" })
});

export const uuidSchema = z.string()
  .uuid({ message: "UUID invalide" });

export const companyIdsSchema = z.array(
  z.string().uuid({ message: "ID de société invalide" })
);
