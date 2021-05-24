const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// Middleware for route handlers
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const matchingDish = dishes.find((dish) => {
    return dish.id === dishId;
  });
  if (!matchingDish) {
    return next({
      status: 404,
      message: `Dish ID, ${dishId}, does not exist.`,
    });
  }
  res.locals.dishId = dishId;
  res.locals.dish = matchingDish;
  return next();
}

function bodyExists(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  if (
    name &&
    description &&
    price > 0 &&
    typeof price === 'number' &&
    image_url
  ) {
    res.locals.body = req.body.data;
    return next();
  }
  next({
    status: 400,
    message: "A name, description, price and image_url is required",
  });
}

// Handlers for /dishes route
function list(req, res, next) {
  res.json({ data: dishes });
}
function create(req, res, next) {
  const body = res.locals.body;
  const newDish = {
    id: nextId(4),
    name: body.name,
    description: body.description,
    price: body.price,
    image_url: body.image_url,
  };
  dishes.push(newDish);
  return res.status(201).json({ data: newDish });
}

// Handlers for /dishes/:dishId route
function read(req, res, next) {
  const readDish = res.locals.dish;
  res.status(200).json({ data: readDish });
}
function update(req, res, next) {
  const dishToUpdate = res.locals.dish;
  const bodyToAdd = res.locals.body;
  const dishId = res.locals.dishId;
  if (bodyToAdd.id && bodyToAdd.id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${bodyToAdd.id}, Route: ${dishId}`,
    });
  }
  dishToUpdate.id = dishId;
  dishToUpdate.name = bodyToAdd.name;
  dishToUpdate.description = bodyToAdd.description;
  dishToUpdate.price = bodyToAdd.price;
  dishToUpdate.image_url = bodyToAdd.image_url;
  res.status(200).json({ data: dishToUpdate });
}

// Exporting Handlers
module.exports = {
  list,
  create: [bodyExists, create],
  read: [dishExists, read],
  update: [dishExists, bodyExists, update],
};
