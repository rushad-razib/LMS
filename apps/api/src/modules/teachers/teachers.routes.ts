import { Router } from "express";
import type { Request } from "express";
import multer from "multer";
import {
  CreateAnnouncementInputSchema,
  CreateLiveSessionInputSchema,
  UpdateAnnouncementInputSchema,
  UpdateLiveSessionInputSchema,
  UpdateTeacherProfileInputSchema,
  UploadMaterialMetaSchema,
} from "@arva/shared";
import { ZodError } from "zod";
import { validateBody } from "../../common/middleware/validate.js";
import { requireAuth, requireRoles } from "../../common/middleware/auth.js";
import { AppError } from "../../common/errors.js";
import * as teachersService from "./teachers.service.js";

export const teachersRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function paramId(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
}

teachersRouter.use(requireAuth, requireRoles("TEACHER"));

teachersRouter.get("/batches", async (req, res, next) => {
  try {
    const batches = await teachersService.listMyBatches(req.user!.id);
    res.json({ batches });
  } catch (err) {
    next(err);
  }
});

teachersRouter.get("/batches/:id", async (req, res, next) => {
  try {
    const batch = await teachersService.getBatchHub(req.user!.id, paramId(req, "id"));
    res.json({ batch });
  } catch (err) {
    next(err);
  }
});

teachersRouter.get("/batches/:id/sessions", async (req, res, next) => {
  try {
    const sessions = await teachersService.listSessions(
      req.user!.id,
      paramId(req, "id"),
    );
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

teachersRouter.post(
  "/batches/:id/sessions",
  validateBody(CreateLiveSessionInputSchema),
  async (req, res, next) => {
    try {
      const session = await teachersService.createSession(
        req.user!.id,
        paramId(req, "id"),
        req.body,
      );
      res.status(201).json({ session });
    } catch (err) {
      next(err);
    }
  },
);

teachersRouter.patch(
  "/batches/:id/sessions/:sessionId",
  validateBody(UpdateLiveSessionInputSchema),
  async (req, res, next) => {
    try {
      const session = await teachersService.updateSession(
        req.user!.id,
        paramId(req, "id"),
        paramId(req, "sessionId"),
        req.body,
      );
      res.json({ session });
    } catch (err) {
      next(err);
    }
  },
);

teachersRouter.delete("/batches/:id/sessions/:sessionId", async (req, res, next) => {
  try {
    const result = await teachersService.deleteSession(
      req.user!.id,
      paramId(req, "id"),
      paramId(req, "sessionId"),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

teachersRouter.get("/batches/:id/materials", async (req, res, next) => {
  try {
    const materials = await teachersService.listMaterials(
      req.user!.id,
      paramId(req, "id"),
    );
    res.json({ materials });
  } catch (err) {
    next(err);
  }
});

teachersRouter.post(
  "/batches/:id/materials",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        next(new AppError(400, "Documents must be 10MB or smaller", "FILE_TOO_LARGE"));
        return;
      }
      next(err);
    });
  },
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError(400, "File is required", "FILE_REQUIRED");
      }
      let meta: { title?: string };
      try {
        meta = UploadMaterialMetaSchema.parse({
          title: typeof req.body?.title === "string" ? req.body.title : undefined,
        });
      } catch (err) {
        if (err instanceof ZodError) {
          throw new AppError(400, "Validation failed", "VALIDATION_ERROR", err.flatten());
        }
        throw err;
      }
      const material = await teachersService.uploadMaterial(
        req.user!.id,
        paramId(req, "id"),
        {
          title: meta.title,
          originalName: file.originalname,
          mimeType: file.mimetype,
          buffer: file.buffer,
        },
      );
      res.status(201).json({ material });
    } catch (err) {
      next(err);
    }
  },
);

teachersRouter.delete(
  "/batches/:id/materials/:materialId",
  async (req, res, next) => {
    try {
      const result = await teachersService.deleteMaterial(
        req.user!.id,
        paramId(req, "id"),
        paramId(req, "materialId"),
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

teachersRouter.get("/batches/:id/announcements", async (req, res, next) => {
  try {
    const announcements = await teachersService.listAnnouncements(
      req.user!.id,
      paramId(req, "id"),
    );
    res.json({ announcements });
  } catch (err) {
    next(err);
  }
});

teachersRouter.post(
  "/batches/:id/announcements",
  validateBody(CreateAnnouncementInputSchema),
  async (req, res, next) => {
    try {
      const announcement = await teachersService.createAnnouncement(
        req.user!.id,
        paramId(req, "id"),
        req.body,
      );
      res.status(201).json({ announcement });
    } catch (err) {
      next(err);
    }
  },
);

teachersRouter.patch(
  "/batches/:id/announcements/:announcementId",
  validateBody(UpdateAnnouncementInputSchema),
  async (req, res, next) => {
    try {
      const announcement = await teachersService.updateAnnouncement(
        req.user!.id,
        paramId(req, "id"),
        paramId(req, "announcementId"),
        req.body,
      );
      res.json({ announcement });
    } catch (err) {
      next(err);
    }
  },
);

teachersRouter.delete(
  "/batches/:id/announcements/:announcementId",
  async (req, res, next) => {
    try {
      const result = await teachersService.deleteAnnouncement(
        req.user!.id,
        paramId(req, "id"),
        paramId(req, "announcementId"),
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

teachersRouter.get("/profile", async (req, res, next) => {
  try {
    const profile = await teachersService.getTeacherProfile(req.user!.id);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

teachersRouter.patch(
  "/profile",
  validateBody(UpdateTeacherProfileInputSchema),
  async (req, res, next) => {
    try {
      const profile = await teachersService.updateTeacherProfile(
        req.user!.id,
        req.body,
      );
      res.json({ profile });
    } catch (err) {
      next(err);
    }
  },
);

teachersRouter.post("/profile/photo", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, "File is required", "VALIDATION_ERROR");
    }
    const profile = await teachersService.uploadTeacherPhoto(
      req.user!.id,
      req.file,
    );
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

teachersRouter.post("/profile/cv", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, "File is required", "VALIDATION_ERROR");
    }
    const profile = await teachersService.uploadTeacherCv(req.user!.id, req.file);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

teachersRouter.delete("/profile/cv", async (req, res, next) => {
  try {
    const profile = await teachersService.deleteTeacherCv(req.user!.id);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});
