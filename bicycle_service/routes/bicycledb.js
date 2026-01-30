import express from "express";
import { STATUS_CODES } from "node:http";
import bicycle_database from "../config/db.js";

const router = express.Router();

const validateContentType = (req, res, next) => {
  if (
    ["POST", "PUT", "PATCH"].includes(req.method) &&
    !req.is("application/json")
  ) {
    return res
      .status(415)
      .json({ error: "Content-Type must be application/json" });
  }
  next();
};

router.use(validateContentType);

const validateBicycleData = (data, isPartial = false) => {
  const error = [];

  if (!isPartial && !data.color) {
    error.push("color is required");
  }

  if (
    data.color !== undefined &&
    (typeof data.color !== "string" || data.color.trim() === "")
  ) {
    error.push("color must be a non-empty string");
  }

  return error;
};

router.get("/", async function (req, res, next) {
  const { limit = 5, offset = 0, color } = req.query;
  try {
    let query = "SELECT * FROM bicyclesdb";
    const params = [];
    const conditions = [];

    if (color) {
      conditions.push("color=?");
      params.push(color);
    }

    if (conditions.length > 0) {
      query += "WHERE" + conditions.join("AND");
    }
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));
    const results = bicycle_database.prepare(query).all(...params);
    const bicycles = results.map((bicycle) => ({
      ...bicycle,
      _links: {
        self: { href: `/bicycles/${bicycle.id}` },
        collection: { href: "/bicycles" },
      },
    }));

    res.json({
      data: bicycles,
      _links: {
        self: { href: `/bicycles?limit=${limit}&offset=${offset}` },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async function (req, res, next) {
  const id = req.params.id;

  try {
    const results = bicycle_database
      .prepare("SELECT * FROM bicyclesdb WHERE id = ?")
      .get(id);
    if (!results) {
      let error = new Error(STATUS_CODES[404]);
      error.status = 404;
      throw error;
    }
    const bicycle = {
      ...results,
      _links: {
        self: { href: `/bicycle/${results.id}` },
        collection: { href: "/bicycle" },
      },
    };
    res.json(bicycle);
  } catch (error) {
    next(error);
  }
});

router.post("/", async function (req, res, next) {
  const { color } = req.body;

  // Validate input
  const errors = validateBicycleData({  color });
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const stmt = bicycle_database.prepare("INSERT INTO bicyclesdb (color) VALUES (?)");
    const info = stmt.run( color.trim());

    // Fetch the created resource
    const createdBicycle = bicycle_database.prepare("SELECT * FROM bicyclesdb WHERE id = ?").get(info.lastInsertRowid);

    // Add HATEOAS links
    const bicycle = {
      ...createdBicycle,
      _links: {
        self: { href: `/bicycles/${createdBicycle.id}` },
        collection: { href: '/bicycles' }
      }
    };

    // Set Location header
    res.location(`/bicycles/${createdBicycle.id}`);
    res.status(201).json(bicycle);
  } catch (error) {
    next(error);
  }
})


export default router;
