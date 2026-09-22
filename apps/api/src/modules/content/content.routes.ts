import { Router } from "express";
import type { Request } from "express";
import multer from "multer";
import {
  CreateBlogPostInputSchema,
  CreateGalleryItemInputSchema,
  CreateMarketingTrainerInputSchema,
  UpdateBlogPostInputSchema,
  UpdateGalleryItemInputSchema,
  UpdateMarketingTrainerInputSchema,
  UpdateSettingsInputSchema,
} from "@arva/shared";
import { validateBody } from "../../common/middleware/validate.js";
import { requireAuth, requireRoles } from "../../common/middleware/auth.js";
import { AppError } from "../../common/errors.js";
import {
  getPublicSettings,
  getSettings,
  toSettingsDto,
  updateSettings,
} from "../settings/settings.service.js";
import * as contentService from "./content.service.js";

export const contentRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

function paramId(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
}

contentRouter.get("/public/settings", async (_req, res, next) => {
  try {
    const settings = await getPublicSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

contentRouter.get("/public/blog", async (_req, res, next) => {
  try {
    const posts = await contentService.listPublishedBlogPosts();
    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

contentRouter.get("/public/blog/:slug", async (req, res, next) => {
  try {
    const post = await contentService.getPublishedBlogBySlug(paramId(req, "slug"));
    res.json({ post });
  } catch (err) {
    next(err);
  }
});

contentRouter.get("/public/gallery", async (_req, res, next) => {
  try {
    const items = await contentService.listPublicGallery();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

contentRouter.get("/public/trainers", async (_req, res, next) => {
  try {
    const trainers = await contentService.listPublishedTrainers();
    res.json({ trainers });
  } catch (err) {
    next(err);
  }
});

contentRouter.get(
  "/admin/blog",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const posts = await contentService.adminListBlogPosts();
      res.json({ posts });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.post(
  "/admin/blog",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(CreateBlogPostInputSchema),
  async (req, res, next) => {
    try {
      const post = await contentService.createBlogPost(req.body);
      res.status(201).json({ post });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.patch(
  "/admin/blog/:id",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(UpdateBlogPostInputSchema),
  async (req, res, next) => {
    try {
      const post = await contentService.updateBlogPost(paramId(req, "id"), req.body);
      res.json({ post });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.delete(
  "/admin/blog/:id",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const result = await contentService.deleteBlogPost(paramId(req, "id"));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.post(
  "/admin/blog/:id/cover",
  requireAuth,
  requireRoles("ADMIN"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError(400, "File is required", "VALIDATION_ERROR");
      const post = await contentService.uploadBlogCover(paramId(req, "id"), req.file);
      res.json({ post });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.get(
  "/admin/gallery",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const items = await contentService.adminListGallery();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.post(
  "/admin/gallery",
  requireAuth,
  requireRoles("ADMIN"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError(400, "File is required", "VALIDATION_ERROR");
      const meta = CreateGalleryItemInputSchema.parse({
        title: req.body?.title || null,
        sortOrder: req.body?.sortOrder ? Number(req.body.sortOrder) : undefined,
      });
      const item = await contentService.createGalleryItem(meta, req.file);
      res.status(201).json({ item });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.patch(
  "/admin/gallery/:id",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(UpdateGalleryItemInputSchema),
  async (req, res, next) => {
    try {
      const item = await contentService.updateGalleryItem(paramId(req, "id"), req.body);
      res.json({ item });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.delete(
  "/admin/gallery/:id",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const result = await contentService.deleteGalleryItem(paramId(req, "id"));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.get(
  "/admin/trainers",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const trainers = await contentService.adminListTrainers();
      res.json({ trainers });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.post(
  "/admin/trainers",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(CreateMarketingTrainerInputSchema),
  async (req, res, next) => {
    try {
      const trainer = await contentService.createTrainer(req.body);
      res.status(201).json({ trainer });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.patch(
  "/admin/trainers/:id",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(UpdateMarketingTrainerInputSchema),
  async (req, res, next) => {
    try {
      const trainer = await contentService.updateTrainer(paramId(req, "id"), req.body);
      res.json({ trainer });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.delete(
  "/admin/trainers/:id",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const result = await contentService.deleteTrainer(paramId(req, "id"));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.post(
  "/admin/trainers/:id/photo",
  requireAuth,
  requireRoles("ADMIN"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError(400, "File is required", "VALIDATION_ERROR");
      const trainer = await contentService.uploadTrainerPhoto(
        paramId(req, "id"),
        req.file,
      );
      res.json({ trainer });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.get(
  "/admin/settings",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const settings = await getSettings();
      res.json({ settings: await toSettingsDto(settings) });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.patch(
  "/admin/settings",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(UpdateSettingsInputSchema),
  async (req, res, next) => {
    try {
      const settings = await updateSettings(req.body);
      res.json({ settings: await toSettingsDto(settings) });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.post(
  "/admin/settings/logo/header",
  requireAuth,
  requireRoles("ADMIN"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError(400, "File is required", "VALIDATION_ERROR");
      const settings = await contentService.uploadSettingsLogo("header", req.file);
      res.json({ settings });
    } catch (err) {
      next(err);
    }
  },
);

contentRouter.post(
  "/admin/settings/logo/footer",
  requireAuth,
  requireRoles("ADMIN"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError(400, "File is required", "VALIDATION_ERROR");
      const settings = await contentService.uploadSettingsLogo("footer", req.file);
      res.json({ settings });
    } catch (err) {
      next(err);
    }
  },
);
