import { DatabaseSync } from "node:sqlite";
const consume_database = new DatabaseSync(":memory:");

consume_database.exec(`
    CREATE TABLE consumer (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    color TEXT NOT NULL
    ) STRICT
    `);

export  default consume_database
