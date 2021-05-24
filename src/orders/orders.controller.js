const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Middle Ware Functions
function bodyExists(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  /*console.log(req.body, 'request body');
    console.log(req.body.data.dishes, 'dishes');*/
  if (
    deliverTo &&
    mobileNumber &&
    dishes &&
    dishes.length > 0 &&
    Array.isArray(dishes)
  ) {
    //console.log('you got here');
    res.locals.body = req.body.data;
    return next();
  }
  next({
    status: 400,
    message: "A deliverTo, mobileNumber, and dishes properties are required",
  });
};

function dishesHaveQuantity(req, res, next) {
  const dishesToCheck = res.locals.body.dishes;
  const quantitiesToCheck = dishesToCheck.map((dish) => dish.quantity);
  console.log(quantitiesToCheck, 'quantities')
  const incorrectQuantity = quantitiesToCheck.findIndex((quantity) => quantity < 1 || !quantity || typeof quantity !== 'number');
  if (incorrectQuantity > -1) {
    return next({
      status: 400,
      message: `Dish ${incorrectQuantity} must have a quantity that is an integer greater than 0`,
    });
  }
  next();
};

function orderExists(req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder){
        res.locals.order = foundOrder;
        res.locals.orderId = orderId;
        return next();
    }
    next({ status: 404, message: `Order Id: ${orderId} does not exist.`});
};

function requestMatchesParam(req, res, next){
    const orderId = res.locals.orderId;
    const requestId = res.locals.body.id;
    if(!requestId || requestId === orderId){
        return next();
    }
    next({ status: 400, message: `Order id does not match route id. Order: ${requestId}, Route: ${orderId}`});
};

function checkStatus(req, res, next){
    const orderStatus = res.locals.body.status;
    if(orderStatus === 'delivered'){
        return next({ status: 400, message: 'A delivered order cannot be changed'});
    } else if(orderStatus === 'pending' || orderStatus === 'preparing' || orderStatus === 'out-for-delivery'){
        return next();
    } else {
        return next({ status: 400, message: 'Order must have a status of pending, preparing, out-for-delivery, delivered'});
    }
};

function seeIfPending(req, res, next){
    const orderStatus = res.locals.order.status;
    if(orderStatus === 'pending'){
        return next();
    }
    return next({ status: 400, message: 'An order cannot be deleted unless it is pending'});
}

// Route handlers for /orders route
function list(req, res, next) {
  res.status(200).json({ data: orders });
}

function create(req, res, next) {
  const bodyToAdd = res.locals.body;
  const newOrder = {
    id: nextId(2),
    deliverTo: bodyToAdd.deliverTo,
    mobileNumber: bodyToAdd.mobileNumber,
    dishes: bodyToAdd.dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// Route handlers for /orders/:orderId route
function read(req, res, next){
    const orderToRead = res.locals.order;
    res.status(200).json({ data: orderToRead });
};

function update(req, res, next){
    const orderToUpdate = res.locals.order;
    const bodyToAdd = res.locals.body;
    const orderId = res.locals.orderId;
    /*orderToUpdate.id = orderId;
    orderToUpdate.*/
    orderToUpdate.deliverTo = bodyToAdd.deliverTo;
    orderToUpdate.mobileNumber = bodyToAdd.mobileNumber;
    orderToUpdate.dishes = bodyToAdd.dishes;
    res.status(200).json({ data: orderToUpdate });
};

function destroy(req, res, next){
    const orderId = res.locals.orderId;
    const index = orders.findIndex((order) => order.id === orderId);
    orders.splice(index, 1);
    res.sendStatus(204);
}
// Exporting Handlers
module.exports = {
  list,
  create: [bodyExists, dishesHaveQuantity, create],
  read: [orderExists, read],
  update: [orderExists, bodyExists, requestMatchesParam, dishesHaveQuantity, checkStatus, update],
  delete: [orderExists, seeIfPending, destroy]
};
