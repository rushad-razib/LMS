import { Router } from "express";
import type { Request } from "express";
import { UpdateStudentProfileInputSchema } from "@arva/shared";
import { validateBody } from "../../common/middleware/validate.js";
import { requireAuth, requireVerifiedStudent } from "../../common/middleware/auth.js";
import * as studentsService from "./students.service.js";

export const studentsRouter = Router();

function paramId(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
}

studentsRouter.use(requireAuth, requireVerifiedStudent);

studentsRouter.get("/enrollments", async (req, res, next) => {
  try {
    const enrollments = await studentsService.listMyEnrollments(req.user!.id);
    res.json({ enrollments });
  } catch (err) {
    next(err);
  }
});

studentsRouter.get("/courses/:slug", async (req, res, next) => {
  try {
    const enrollment = await studentsService.getCourseHub(
      req.user!.id,
      paramId(req, "slug"),
    );
    res.json({ enrollment });
  } catch (err) {
    next(err);
  }
});

studentsRouter.get("/courses/:slug/sessions", async (req, res, next) => {
  try {
    const sessions = await studentsService.listCourseSessions(
      req.user!.id,
      paramId(req, "slug"),
    );
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

studentsRouter.get("/courses/:slug/materials", async (req, res, next) => {
  try {
    const materials = await studentsService.listCourseMaterials(
      req.user!.id,
      paramId(req, "slug"),
    );
    res.json({ materials });
  } catch (err) {
    next(err);
  }
});

studentsRouter.get("/courses/:slug/announcements", async (req, res, next) => {
  try {
    const announcements = await studentsService.listCourseAnnouncements(
      req.user!.id,
      paramId(req, "slug"),
    );
    res.json({ announcements });
  } catch (err) {
    next(err);
  }
});

studentsRouter.get("/profile", async (req, res, next) => {
  try {
    const profile = await studentsService.getStudentProfile(req.user!.id);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

studentsRouter.patch(
  "/profile",
  validateBody(UpdateStudentProfileInputSchema),
  async (req, res, next) => {
    try {
      const profile = await studentsService.updateStudentProfile(
        req.user!.id,
        req.body,
      );
      res.json({ profile });
    } catch (err) {
      next(err);
    }
  },
);
