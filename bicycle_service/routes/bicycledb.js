import express from 'express'
import {STATUS_CODES} from 'node:http'
import db from '../config/db.js'
import url from 'node:url'
const router = express.Router()

const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  next();
};

router.use(validateContentType);

const validataBicycleData = (data, isPartial = false) => {
 const error = []
 
if(!isPartial && !data.color) {
    error.push('color is required')
}

if(data.color !== undefined && (typeof data.color !== 'string' || data.color.trim() === '' )) {
    error.push('color must be a non-empty string')
}

return error
}