import { Graph, Retriever } from "./RAG_class.js";
import "dotenv/config";
import { workflow } from "./basic_workflow.js";
export const agent = new Graph({ workflow }).init();

export const retriever = await new Retriever();
// export const retriever = await new Retriever().init(3);
