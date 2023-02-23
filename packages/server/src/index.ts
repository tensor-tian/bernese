import Debug from "debug";
import { Response } from "@bernese/interface";
import { name } from "@/db";

const debug = Debug("b:server:index");
debug(name);
const resp: Response<string> = { code: 0, data: "" };

debug("resp:", resp);
