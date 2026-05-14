import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import departmentsRouter from "./departments";
import usersRouter from "./users";
import reportsRouter from "./reports";
import membersRouter from "./members";
import tasksRouter from "./tasks";
import announcementsRouter from "./announcements";
import eventsRouter from "./events";
import attendanceRouter from "./attendance";
import delegationsRouter from "./delegations";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/departments", departmentsRouter);
router.use("/users", usersRouter);
router.use("/reports", reportsRouter);
router.use("/members", membersRouter);
router.use("/tasks", tasksRouter);
router.use("/announcements", announcementsRouter);
router.use("/events", eventsRouter);
router.use("/attendance", attendanceRouter);
router.use("/delegations", delegationsRouter);
router.use("/notifications", notificationsRouter);
router.use("/analytics", analyticsRouter);

export default router;
