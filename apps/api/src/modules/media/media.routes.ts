import { Router } from "express";
import * as mediaService from "./media.service.js";

export const mediaRouter = Router();

mediaRouter.get("/download", async (req, res, next) => {
  try {
    const key = typeof req.query.key === "string" ? req.query.key : undefined;
    const exp = typeof req.query.exp === "string" ? req.query.exp : undefined;
    const sig = typeof req.query.sig === "string" ? req.query.sig : undefined;
    const { body, fileName } = await mediaService.readLocalDownload({
      key,
      exp,
      sig,
    });
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName.replace(/"/g, "")}"`,
    );
    res.send(body);
  } catch (err) {
    next(err);
  }
});
