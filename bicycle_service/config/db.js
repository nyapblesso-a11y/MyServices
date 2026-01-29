import {DatabaseSync} from 'node:sqlite'
const bicycle_database = new DatabaseSync(":memory:")

bicycle_database.exec(`
    CREATE TABLE bicyclesdb (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    color TEXT NOT NULL
    ) STRICT
    `)

bicycle_database.exec (`
    INSERT INTO bicyclesdb (color) VALUES
    ('Red'), ('Blue'), ('Green'), ('Black')
    `)

export default bicycle_database