import Debug from "debug";
import { Response } from "@bernese/shared/src/types";
import { initialize as initializeDB } from "@/data";

const debug = Debug("b:server:index");
const resp: Response<string> = { code: 0, data: "" };
// initializeDB();

debug("resp:", resp);
