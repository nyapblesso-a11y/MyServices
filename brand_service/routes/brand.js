import express from "express";
import { STATUS_CODES } from "node:http";
import brand_database from "../config/db.js";

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
  const errors = [];

  if (!isPartial && !data.brand) {
    errors.push("brand is required");
  }

  if (
    data.brand !== undefined &&
    (typeof data.brand !== "string" || data.brand.trim() === "")
  ) {
    errors.push("brand must be a non-empty string");
  }

  return errors;
};

router.get("/", async function (req, res, next) {
  try {
    const { limit = 5, offset = 0, brand, color } = req.query;
    let query = "SELECT * FROM brands";
    const conditions = [];
    const params = [];

    if (brand) {
      conditions.push("brand = ?");
      params.push(brand);
    }

    if (conditions.length > 0) {
      query += "WHERE" + conditions.join("AND");
    }
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const results = brand_database.prepare(query).all(...params);

    const brands = results.map((brand) => ({
      ...brand,
      _links: {
        self: { href: `/brand/${brand.id}` },
        collection: { href: "/brand" },
      },
    }));

    res.json({
      data: brands,
      _links: {
        self: { href: `/brand?limit=${limit}&offset=${offset}` },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async function (req, res, next) {
    const id = req.params.id
  try {
    const result = brand_database.prepare("SELECT * FROM brands WHERE id = ?").get(id);
    if (!result) {
      let error = new Error(STATUS_CODES[404]);
      error.status = 404;
      throw error;
    }

    // Add HATEOAS links
    const brand = {
      ...result,
      _links: {
        self: { href: `/brand/${result.id}` },
        collection: { href: '/brand' }
      }
    };

    res.json(brand);
  } catch (error) {
    next(error);
  }
})


router.post("/", async function (req, res, next) {
  const { brand } = req.body;

  // Validate input
  const errors = validateBicycleData({brand });
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const stmt = brand_database.prepare("INSERT INTO brands (brand) VALUES (?)");
    const info = stmt.run( brand.trim());

    // Fetch the created resource
    const createdBicycle = brand_database.prepare("SELECT * FROM brands WHERE id = ?").get(info.lastInsertRowid);

    // Add HATEOAS links
    const brands = {
      ...createdBicycle,
      _links: {
        self: { href: `/brand/${createdBicycle.id}` },
        collection: { href: '/brand' }
      }
    };

    // Set Location header
    res.location(`/brand/${createdBicycle.id}`);
    res.status(201).json(brands);
  } catch (error) {
    next(error);
  }
})

export default router;
