import express from 'express'
import {STATUS_CODE}  from 'node:http'
import db from '../config/db.js'

const router = express.Router()
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  next();
};

router.use(validateContentType);

const validateBicycleData = (data, isPartial = false) => {
  const errors = [];

  if (!isPartial && !data.brand) {
    errors.push('brand is required');
  }

  if (data.brand !== undefined && (typeof data.brand !== 'string' || data.brand.trim() === '')) {
    errors.push('brand must be a non-empty string');
  }
  
  return errors;
};