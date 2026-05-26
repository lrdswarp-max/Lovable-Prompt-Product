import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import exercisesRouter from "./exercises";
import studentsRouter from "./students";
import plansRouter from "./plans";
import sessionsRouter from "./sessions";
import conversationsRouter from "./conversations";
import meRouter from "./me";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(exercisesRouter);
router.use(studentsRouter);
router.use(plansRouter);
router.use(sessionsRouter);
router.use(conversationsRouter);
router.use(meRouter);

export default router;
