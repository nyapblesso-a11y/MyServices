import express from "express";
import createError from "http-errors";

import consume_database from "../config/db.js";
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

// Input validation helper
const validateBicycleData = (data, isPartial = false) => {
  const errors = [];

  if (!isPartial && !data.brand) {
    errors.push("brand is required");
  }
  if (!isPartial && !data.color) {
    errors.push("color is required");
  }

  if (
    data.brand !== undefined &&
    (typeof data.brand !== "string" || data.brand.trim() === "")
  ) {
    errors.push("brand must be a non-empty string");
  }
  if (
    data.color !== undefined &&
    (typeof data.color !== "string" || data.color.trim() === "")
  ) {
    errors.push("color must be a non-empty string");
  }

  return errors;
};

const { BICYCLE_SERVICE_PORT = 5000, BRAND_SERVICE_PORT = 3030 } = process.env;

const bicycleService = `http://localhost:${BICYCLE_SERVICE_PORT}`;
const brandService = `http://localhost:${BRAND_SERVICE_PORT}`;

router.post("/store", (req, res) => {
  const { color, brand } = req.body;
  const query = `INSERT INTO consumer (color,brand) VALUES (?,?)`;
  consume_database.query(query, [color, brand], (error, results));
});

router.get("/:id", async function (req, res, next) {
  const { id } = req.params;

  const noop = Function.prototype;
  const bicycleReq = await fetch(`${bicycleService}/bicycle/${id}`);
  const brandReq = await fetch(`${brandService}/brand/${id}`);

  if (bicycleReq.status === 404 || brandReq.status === 404) {
    next(createError(404, "Bicycle or Brand not found"));
    return
  }

  if (bicycleReq.status === 400 || brandReq.status === 400) {
    next(createError(400, "Bad Request to Bicycle or Brand service"));
    return
  }

  const bicycleProm = bicycleReq.json();
  const brandProm = brandReq.json();

  bicycleProm.catch(noop);

  
  
  const results = await Promise.allSettled([bicycleProm, brandProm]);

  const mapped = results.map(item => {
  if (item.value.color) {
    return {
      id: item.value.id,
      color: item.value.color
    };
  }

  if (item.value.brand) {
    return {
      brand: item.value.brand
    };
  }
});

const combined = Object.assign({}, ...mapped);

res.send(combined)
});

export default router;
