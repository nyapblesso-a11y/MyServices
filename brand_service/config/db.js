import { DatabaseSync } from "node:sqlite";
const brand_database = new DatabaseSync(":memory:");

brand_database.exec(`
    CREATE TABLE brands (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL
    ) STRICT
    `);

brand_database.exec(`
    INSERT INTO brands (brand) VALUES ('Santa Cruz'),('Kona'),('Yeti Cycles'),('Orbea')
        `);
export default brand_database