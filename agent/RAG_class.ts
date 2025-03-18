// import { CloseVectorNode } from "@langchain/community/vectorstores/closevector/node";
// import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { TextLoader } from "langchain/document_loaders/fs/text";
// import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
// import { HumanMessage } from "@langchain/core/messages";
// import * as fs from "fs";
// import sqlite3, { verbose } from "sqlite3";

// export const execute = async (db, sql, params = []) => {
// 	if (params && params.length > 0) {
// 		return new Promise((resolve, reject) => {
// 			db.run(sql, params, (err) => {
// 				if (err) reject(err);
// 				resolve();
// 			});
// 		});
// 	}
// 	return new Promise((resolve, reject) => {
// 		db.exec(sql, (err) => {
// 			if (err) reject(err);
// 			resolve();
// 		});
// 	});
// };

// export class RAG {
// 	#llm;
// 	#retriever;
// 	constructor(
// 		{ llm = new LLM(), retriever = new Retriever() } = {
// 			llm: new LLM(),
// 			retriever: new Retriever(),
// 		},
// 	) {
// 		this.#llm = llm;
// 		this.#retriever = retriever;
// 		// TODO: убрать ретривер
// 	}
// }

// export class LLM {
// 	constructor(
// 		params = {
// 			temperature: 0,
// 			modelName: "gpt-4o-mini",
// 			// verbose: true,
// 		},
// 	) {
// 		this.modelName = "gpt-4o-mini";
// 		this.baseURL = "https://api.proxyapi.ru/openai/v1/";
// 		this.model = new ChatOpenAI({
// 			configuration: { baseURL: this.baseURL },
// 			modelName: this.modelName,
// 			// temperature: temperature,
// 			...params,
// 			//... other options if needed
// 		});
// 	}
// }

// export class Retriever {
// 	#vectoreStore;
// 	#embeddings;
// 	#loader;
// 	#splitter;
// 	filePath = "./text.txt";
// 	constructor(
// 		{
// 			embeddings = new OpenAIEmbeddings({
// 				configuration: { baseURL: "https://api.proxyapi.ru/openai/v1/" },
// 			}),
// 			loader = new TextLoader("./text.txt"),
// 			splitter = new RecursiveCharacterTextSplitter(),
// 		} = {
// 			embeddings: new OpenAIEmbeddings({
// 				configuration: { baseURL: "https://api.proxyapi.ru/openai/v1/" },
// 			}),
// 			loader: new TextLoader("./text.txt"),
// 			splitter: new RecursiveCharacterTextSplitter(),
// 		},
// 	) {
// 		this.#embeddings = embeddings;
// 		this.#loader = loader;
// 		this.#splitter = splitter;
// 	}

// 	async #loadVectoreStore() {
// 		if (fs.existsSync(this.filePath)) {
// 			fs.writeFileSync(this.filePath, "Hello world");
// 		}
// 		const docs = await this.#loader.load();
// 		const allSplits = await this.#splitter.splitDocuments(docs);
// 		const vectorStore = await CloseVectorNode.fromDocuments(
// 			allSplits,
// 			this.#embeddings,
// 		);
// 		const directory = "./store/";
// 		if (!fs.existsSync(directory)) {
// 			fs.mkdirSync(directory);
// 			await vectorStore.save(directory);
// 		}

// 		const loadedVectorStore = await CloseVectorNode.load(
// 			directory,
// 			this.#embeddings,
// 		);
// 		console.log("vectorStore loaded");
// 		this.#vectoreStore = loadedVectorStore;
// 	}

// 	async #createRetriever(params = 3) {
// 		const vectorStore = await this.#vectoreStore;
// 		this.retriever = vectorStore.asRetriever(params);
// 	}

// 	async init(params = 3) {
// 		const directory = "./store/";

// 		await this.#loadVectoreStore();

// 		await this.#createRetriever(params);
// 		return this.retriever;
// 	}

// 	async invoke(params) {
// 		return await this.retriever.invoke(params);
// 	}
// }

// export class Graph {
// 	constructor(
// 		{
// 			checkpointer = SqliteSaver.fromConnString(
// 				"./checkpointer/checkpoints.db",
// 			),
// 			workflow,
// 		} = {
// 			checkpointer: SqliteSaver.fromConnString("./checkpointer/checkpoints.db"),
// 			workflow,
// 		},
// 	) {
// 		this.workflow = workflow;
// 		this.checkpointer = checkpointer;
// 	}
// 	init() {
// 		if (!fs.existsSync("./checkpointer/checkpoints.db")) {
// 			fs.mkdirSync("./checkpointer");
// 		}
// 		this.app = this.workflow.compile({ checkpointer: this.checkpointer });
// 		return this;
// 	}
// 	async ask(input, thread) {
// 		const finalState = await this.app.invoke(
// 			{ messages: [new HumanMessage(input)] },
// 			{ configurable: { thread_id: thread } },
// 		);

// 		return finalState.messages[finalState.messages.length - 1].content;
// 	}
// 	async clearMessageHistory(thread_id) {
// 		const db = new sqlite3.Database(
// 			"./checkpointer/checkpoints.db",
// 			sqlite3.OPEN_READWRITE,
// 		);
// 		const sql = `DELETE FROM checkpoints WHERE thread_id = '${thread_id}'`;
// 		try {
// 			console.log(sql);
// 			await execute(db, sql);
// 		} catch (err) {
// 			console.log(err);
// 		} finally {
// 			db.close();
// 		}
// 	}
// }
import { Database } from "sqlite3";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CloseVectorNode } from "@langchain/community/vectorstores/closevector/node";
import fs from "fs";
import { HumanMessage } from "@langchain/core/messages";
import sqlite3 from "sqlite3";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";

interface ExecuteParams {
	db: Database;
	sql: string;
	params?: any[];
}

export const execute = async ({
	db,
	sql,
	params = [],
}: ExecuteParams): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (params && params.length > 0) {
			db.run(sql, params, (err: Error | null) => {
				if (err) reject(err);
				else resolve();
			});
		} else {
			db.exec(sql, (err: Error | null) => {
				if (err) reject(err);
				else resolve();
			});
		}
	});
};

export class RAG {
	private llm: LLM;
	private retriever: Retriever;

	constructor({
		llm = new LLM(),
		retriever = new Retriever(),
	}: { llm?: LLM; retriever?: Retriever } = {}) {
		this.llm = llm;
		this.retriever = retriever;
		// TODO: убрать ретривер
	}
}

export class LLM {
	modelName: string;
	baseURL: string;
	model: ChatOpenAI;

	constructor(
		params: {
			temperature?: number;
			modelName?: string;
		} = {},
	) {
		this.modelName = params.modelName || "gpt-4o-mini";
		this.baseURL = "https://api.proxyapi.ru/openai/v1/";
		this.model = new ChatOpenAI({
			configuration: { baseURL: this.baseURL },
			modelName: this.modelName,
			...params,
		});
	}
}

export class Retriever {
	private vectoreStore: any;
	private embeddings: OpenAIEmbeddings;
	private loader: TextLoader;
	private splitter: RecursiveCharacterTextSplitter;
	retriever: any;
	filePath: string = "./text.txt";

	constructor({
		embeddings = new OpenAIEmbeddings({
			configuration: { baseURL: "https://api.proxyapi.ru/openai/v1/" },
		}),
		loader = new TextLoader("./text.txt"),
		splitter = new RecursiveCharacterTextSplitter(),
	}: {
		embeddings?: OpenAIEmbeddings;
		loader?: TextLoader;
		splitter?: RecursiveCharacterTextSplitter;
	} = {}) {
		this.embeddings = embeddings;
		this.loader = loader;
		this.splitter = splitter;
	}

	private async loadVectoreStore(): Promise<void> {
		if (!fs.existsSync(this.filePath)) {
			fs.writeFileSync(this.filePath, "12345");
		}
		const docs = await this.loader.load();
		const allSplits = await this.splitter.splitDocuments(docs);
		const vectorStore = await CloseVectorNode.fromDocuments(
			allSplits,
			this.embeddings,
		);
		const directory = "./store/";
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory);
			await vectorStore.save(directory);
		}

		const loadedVectorStore = await CloseVectorNode.load(
			directory,
			this.embeddings,
		);
		console.log("vectorStore loaded");
		this.vectoreStore = loadedVectorStore;
	}

	private async createRetriever(params: number = 3): Promise<void> {
		const vectorStore: CloseVectorNode = await this.vectoreStore;
		this.retriever = vectorStore.asRetriever(params);
	}

	async init(params: number = 3): Promise<any> {
		const directory = "./store/";

		await this.loadVectoreStore();

		await this.createRetriever(params);
		return this.retriever;
	}

	async invoke(params: any): Promise<any> {
		return await this.retriever.invoke(params);
	}
}

export class Graph {
	private checkpointer: any;
	private workflow: any;
	private app: any;

	constructor({
		checkpointer = SqliteSaver.fromConnString("./checkpointer/checkpoints.db"),
		workflow,
	}: {
		checkpointer?: any;
		workflow?: any;
	} = {}) {
		this.workflow = workflow;
		this.checkpointer = checkpointer;
	}

	init(): this {
		if (!fs.existsSync("./checkpointer/checkpoints.db")) {
			fs.mkdirSync("./checkpointer");
		}
		this.app = this.workflow.compile({ checkpointer: this.checkpointer });
		return this;
	}

	async ask(input: string, thread: string): Promise<string> {
		const finalState = await this.app.invoke(
			{ messages: [new HumanMessage(input)] },
			{ configurable: { thread_id: thread } },
		);

		return finalState.messages[finalState.messages.length - 1].content;
	}

	async clearMessageHistory(thread_id: string): Promise<void> {
		const db = new sqlite3.Database(
			"./checkpointer/checkpoints.db",
			sqlite3.OPEN_READWRITE,
		);
		const sql = `DELETE FROM checkpoints WHERE thread_id = '${thread_id}'`;
		try {
			console.log(sql);
			await execute({ db, sql });
		} catch (err) {
			console.log(err);
		} finally {
			db.close();
		}
	}
}
