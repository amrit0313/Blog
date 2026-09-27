import expres from "express";
import { listUsers, detailUser, editUser, deleteUser } from "./user.controller";
import { authenticateToken } from "../auth/auth.middleware";
import bodyValidator, {
  paramsValidator,
} from "../../services/validator.middleware";
import { userParamsValidation, userUpdateValidation } from "./user.validation";

const router = expres.Router();

router.get("", listUsers);
router.get("/:id", paramsValidator(userParamsValidation), detailUser);
router.patch(
  "",
  authenticateToken,
  bodyValidator(userUpdateValidation),
  editUser,
);
router.delete("", authenticateToken, deleteUser);

export default router;
