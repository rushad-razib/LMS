import { Router } from "express";
import type { Request } from "express";
import {
  AssignBatchTeacherInputSchema,
  CreateBatchInputSchema,
  CreateCourseInputSchema,
  UpdateBatchInputSchema,
  UpdateCourseInputSchema,
} from "@arva/shared";
import { validateBody } from "../../common/middleware/validate.js";
import { requireAuth, requireRoles } from "../../common/middleware/auth.js";
import * as coursesService from "./courses.service.js";

export const coursesRouter = Router();

function paramId(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
}

coursesRouter.get("/public", async (_req, res, next) => {
  try {
    const courses = await coursesService.listPublishedCourses();
    res.json({ courses });
  } catch (err) {
    next(err);
  }
});

coursesRouter.get("/public/:slug", async (req, res, next) => {
  try {
    const course = await coursesService.getPublishedCourseBySlug(paramId(req, "slug"));
    res.json({ course });
  } catch (err) {
    next(err);
  }
});

coursesRouter.get("/", requireAuth, requireRoles("ADMIN"), async (_req, res, next) => {
  try {
    const courses = await coursesService.adminListCourses();
    res.json({ courses });
  } catch (err) {
    next(err);
  }
});

coursesRouter.get(
  "/teachers",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const teachers = await coursesService.listTeachers();
      res.json({ teachers });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.get(
  "/batches",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const courseId =
        typeof req.query.courseId === "string" ? req.query.courseId : undefined;
      const batches = await coursesService.adminListBatches(courseId);
      res.json({ batches });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.post(
  "/batches",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(CreateBatchInputSchema),
  async (req, res, next) => {
    try {
      const batch = await coursesService.createBatch(req.body);
      res.status(201).json({ batch });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.patch(
  "/batches/:id",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(UpdateBatchInputSchema),
  async (req, res, next) => {
    try {
      const batch = await coursesService.updateBatch(paramId(req, "id"), req.body);
      res.json({ batch });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.patch(
  "/batches/:id/teacher",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(AssignBatchTeacherInputSchema),
  async (req, res, next) => {
    try {
      const batch = await coursesService.assignBatchTeacher(
        paramId(req, "id"),
        req.body.teacherId,
      );
      res.json({ batch });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.delete(
  "/batches/:id",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const result = await coursesService.deleteBatch(paramId(req, "id"));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.post(
  "/",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(CreateCourseInputSchema),
  async (req, res, next) => {
    try {
      const course = await coursesService.createCourse(req.body);
      res.status(201).json({ course });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.get("/:id", requireAuth, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const course = await coursesService.adminGetCourse(paramId(req, "id"));
    res.json({ course });
  } catch (err) {
    next(err);
  }
});

coursesRouter.patch(
  "/:id",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(UpdateCourseInputSchema),
  async (req, res, next) => {
    try {
      const course = await coursesService.updateCourse(paramId(req, "id"), req.body);
      res.json({ course });
    } catch (err) {
      next(err);
    }
  },
);

coursesRouter.delete(
  "/:id",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const result = await coursesService.deleteCourse(paramId(req, "id"));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);
