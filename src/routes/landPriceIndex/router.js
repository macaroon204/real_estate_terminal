'use strict';

import { Router } from "express";
import { parseSyncReq } from "./mw.js";
import { syncHandler } from "./handler.js";

const router = Router();

router.get("/sync", parseSyncReq, syncHandler);

export default router;
