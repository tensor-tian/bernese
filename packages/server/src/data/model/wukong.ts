import Debug from "@bernese/shared/src/debug";
import { HTTPClient } from "@bernese/shared/src/http";
import { baseURL } from "@/config";
import prepareMarkdown from "./markdown";
const debug = Debug();

const http = new HTTPClient(baseURL.fulltext);

export async function addDoc(id: number, text: string) {
  const preparedText = prepareMarkdown(text);
  const { code, data } = await http.post("addDoc", {
    id,
    doc: { content: preparedText },
  });
  debug("add doc:", code, data);
  if (code !== 0) {
    throw new Error(`update fulltext document failed: ${data}`);
  }
}

export async function removeDoc(id: number) {
  const { code, data } = await http.post("removeDoc", { id });
  debug("remove doc:", code, data);
  if (code !== 0) {
    throw new Error(`remove fulltext document failed: ${data}`);
  }
}

export async function searchDoc(text: string) {
  const { code, data } = await http.post<{
    code: number;
    data: {
      docs: { docId: number; scores: number[] }[];
    };
  }>("searchDoc", { text });
  debug("search doc:", code, data);
  if (code !== 0) {
    throw new Error(`search fulltext document failed: ${data}`);
  }
  return data.docs || [];
}
