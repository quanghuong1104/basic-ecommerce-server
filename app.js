const express = require('express');
const app = express();
const UserModel = require('./models/user.model');
const ProductModel = require('./models/product.model');
const CategoryModel = require('./models/category.model');
const CartModel = require('./models/cart.model');
const VariantModel = require('./models/variant.model');
const OrderModel = require('./models/order.model');
const InventoryModel = require('./models/inventory.model');
const jwt = require('jsonwebtoken');
const cors = require('cors');

app.use(express.json());
app.use(express.static('public'));
app.use(
  cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
  }),
);
app.options('*', cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

/**
 * Database connection
 */
const connectorInstance = require('./database/connector.database');
const { Types } = require('mongoose');
connectorInstance.connect();

/* Apis */
app.post('/api/sign-in', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại' });
    }
    if (user.password !== password) {
      return res.status(400).json({ message: 'Mật khẩu không chính xác' });
    }

    const { name, role, email: userEmail, avatar } = user._doc;
    jwt.sign({ id: user._id }, 'hello', {}, function (err, token) {
      console.log('token:: ', token);
      console.log(err);
      res.json({
        message: 'Đăng nhập thành công',
        data: {
          user: { name, role, email: userEmail, avatar },
          token,
        },
      });
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/sign-up', async (req, res, next) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    const u = await UserModel.create({ email, password, name });
    res.status(201).json({ message: 'Đăng ký thành công', data: { id: u._id } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', async (req, res, next) => {
  const { category } = req.query;
  try {
    const ps = category ? await ProductModel.find({ category }) : await ProductModel.find();
    const products = await Promise.all(
      ps.map(async (p) => {
        const variants = await VariantModel.find({ product: p._id.toString() });
        return { ...p._doc, variants };
      }),
    );
    return res.json({ data: { products } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/product-detail/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const p = await ProductModel.findOne({ _id: new Types.ObjectId(id) });
    const variants = await VariantModel.find({ product: id });
    const inventory = await InventoryModel.findOne({ product_id: id });
    return res.json({
      data: {
        product: {
          ...p._doc,
          variants,
          stock_details: { total: inventory.stock, variant_stocks: inventory.variants },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/category', async (req, res, next) => {
  try {
    const cats = await CategoryModel.find();
    return res.json({ data: { categories: cats } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/product-by-ids', async (req, res, next) => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
  console.log('request product by ids');
  const { ids } = req.query;
  if (ids === '') return res.json({ data: { products: [] } });
  const products = await Promise.all(
    ids.split(',').map(async (id) => {
      const product = await ProductModel.findOne({ _id: new Types.ObjectId(id) });
      const variants = await VariantModel.find({ product: id });
      return {
        ...product._doc,
        variants: variants,
      };
    }),
  );
  return res.json({ data: { products } });
});

app.use((req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token.split(' ')[1], 'hello', function (err, decoded) {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.id = decoded.id;
    next();
  });
});

app.get('/api/user-infor', async (req, res, next) => {
  const user_id = req.id;
  try {
    const user = await UserModel.findOne({ _id: new Types.ObjectId(user_id) }).select(
      '-_id name email avatar',
    );
    return res.json({ data: { user } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/sign-out', async (req, res, next) => {
  const user_id = req.id;
  try {
    const user = await UserModel.findOne({ _id: new Types.ObjectId(user_id) }).select(
      '-_id name email avatar',
    );
    return res.json({ data: { id: user_id } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/order', async (req, res, next) => {
  const { state } = req.query;
  try {
    const orders = !state
      ? await OrderModel.find()
      : await OrderModel.find({ state, user_id: req.id });
    return res.json({ data: { orders } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/cart', async (req, res, next) => {
  const user_id = req.id;
  try {
    const cart = await CartModel.findOne({ user_id });
    if (!cart) {
      await CartModel.create({ user_id, products: [] });
      return res.json({ data: { products: [] } });
    }
    const products = await Promise.all(
      cart?.products.map(async (p) => {
        const product = await ProductModel.findOne({ _id: p.product_id }).select(
          'name desc min_price thumb_url variants checkout -_id stock',
        );
        const variants = await VariantModel.find({ product: p.product_id });
        const result = { ...p._doc, ...product._doc, variants, price: product.min_price };
        delete result['min_price'];
        return result;
      }),
    );
    return res.json({ data: { products: cart ? (products.length ? products : []) : [] } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/cart/sync', async (req, res) => {
  const products = req.body?.products;
  if (!products || !products?.length) return res.json({ data: {} });

  console.log('products');
  products.map((p) => {
    console.log(p);
  });

  const user_id = req.id;
  let cart = await CartModel.findOne({ user_id });

  if (!cart) {
    cart = await CartModel.create({ user_id, products: [] });
  }

  products.forEach((p) => {
    const sameProduct = cart.products.find(
      (product) => product.product_id === p.product_id && product.variant_id === p.variant_id,
    );
    if (sameProduct) {
      sameProduct.quantity += p.quantity;
    } else {
      cart.products.push(p);
    }
  });
  cart.product_count = cart.products.length;

  await cart.save();

  res.status(200).json({ message: 'Sản phẩm không thêm vào giỏ hàng', data: {} });
});

app.put('/api/cart', async (req, res) => {
  const { product_id, variant_id, quantity, checkout } = req.body;
  console.log(req.body);
  const user_id = req.id;
  try {
    let cart = await CartModel.findOne({ user_id });
    if (!cart) {
      cart = await CartModel.create({ user_id, products: [] });
    }

    const existingProductIndex = cart.products.findIndex(
      (p) => p.product_id === product_id && variant_id === p.variant_id,
    );

    if (quantity === 0) {
      cart.products.splice(existingProductIndex, 1);
      cart.product_count = cart.products.length;
      await cart.save();

      const pDetail = await ProductModel.findOne({ _id: product_id }).select(
        'name desc min_price thumb_url variants checkout -_id',
      );
      const variants = await VariantModel.find({ product: product_id });
      const result = { ...pDetail._doc, ...req.body, variants, price: pDetail.min_price };
      delete result['min_price'];

      return res
        .status(200)
        .json({ message: 'Sản phẩm đã được thêm vào giỏ hàng', data: { product: result } });
    }

    if (existingProductIndex !== -1) {
      cart.products[existingProductIndex].variant_id = variant_id;
      cart.products[existingProductIndex].quantity = quantity;
      cart.products[existingProductIndex].checkout = checkout;
    } else {
      cart.products.push({ product_id, variant_id, quantity, checkout: true });
    }

    cart.product_count = cart.products.length;
    await cart.save();

    /* product detail (afftecd product) */
    const pDetail = await ProductModel.findOne({ _id: product_id }).select(
      'name desc min_price thumb_url variants checkout -_id',
    );
    const variants = await VariantModel.find({ product: product_id });
    const result = { ...pDetail._doc, ...req.body, variants, price: pDetail.min_price };
    delete result['min_price'];

    res
      .status(200)
      .json({ message: 'Sản phẩm đã được thêm vào giỏ hàng', data: { product: result } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
});

app.get('/api/checkout', async (req, res, next) => {
  const user_id = req.id;

  try {
    const cart = await CartModel.findOne({ user_id });

    if (!cart || cart.products.length === 0) {
      return res.json({
        data: {
          products: [],
          checkout_infor: {
            total_price: 0,
            total_discount: 0,
            total_shippment: 0,
            final_price: 0,
          },
        },
      });
    }

    const productsToCheckout = cart.products.filter((product) => product.checkout);
    const productDetails = await Promise.all(
      productsToCheckout.map(async (product) => {
        const pDetail = await ProductModel.findOne({ _id: product.product_id }).select('name desc');
        const variants = await VariantModel.find({ product: product.product_id }).select(
          'price options thumb_url',
        );
        const pickedV = variants.find((v) => v._id.toString() === product.variant_id);
        return {
          ...pDetail._doc,
          price: pickedV.price,
          thumb_url: pickedV.thumb_url,
          quantity: product.quantity,
          variant: Object.values(pickedV.options).join(', '),
          variant_id: pickedV._id,
        };
      }),
    );

    if (productsToCheckout.length === 0) {
      return res.status(400).json({ message: 'No produts to checkout' });
    }

    // Tính tổng giá
    let totalAmount = 0;

    for (const product of productsToCheckout) {
      let price;

      // Nếu có variant_id, tìm giá từ variant
      if (product.variant_id && product.variant_id !== '') {
        const variant = await VariantModel.findById(product.variant_id);
        if (variant) {
          price = variant.price;
        } else {
          return res
            .status(404)
            .json({ message: `Variant với ID ${product.variant_id} không tìm thấy` });
        }
      } else {
        // Nếu không có variant_id, tìm giá từ sản phẩm
        const productDetails = await ProductModel.findById(product.product_id);
        if (productDetails) {
          price = productDetails.min_price;
        } else {
          return res
            .status(404)
            .json({ message: `Sản phẩm với ID ${product.product_id} không tìm thấy` });
        }
      }

      // Tính tổng giá
      totalAmount += price * product.quantity;
    }

    // Trả về tổng giá
    return res.json({
      data: {
        products: productDetails,
        checkout_infor: {
          total_price: totalAmount,
          total_discount: 0,
          total_shippment: 0,
          final_price: totalAmount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/checkout', async (req, res, next) => {
  const user_id = req.id;

  let cart = await CartModel.findOne({ user_id });
  if (!cart) {
    cart = await CartModel.create({ user_id, products: [] });
    return res.status(400).json({ message: 'No produts to checkout' });
  }
  const productsToCheckout = cart.products.filter((product) => product.checkout);

  if (productsToCheckout.length === 0) {
    return res.status(400).json({ message: 'No produts to checkout' });
  }

  // Tính tổng giá
  let totalAmount = 0;

  for (const product of productsToCheckout) {
    let price;

    // Nếu có variant_id, tìm giá từ variant
    if (product.variant_id && product.variant_id !== '') {
      const variant = await VariantModel.findById(product.variant_id);
      if (variant) {
        price = variant.price;
      } else {
        return res
          .status(404)
          .json({ message: `Variant với ID ${product.variant_id} không tìm thấy` });
      }
    } else {
      // Nếu không có variant_id, tìm giá từ sản phẩm
      const productDetails = await ProductModel.findById(product.product_id);
      if (productDetails) {
        price = productDetails.min_price;
      } else {
        return res
          .status(404)
          .json({ message: `Sản phẩm với ID ${product.product_id} không tìm thấy` });
      }
    }

    // Tính tổng giá
    totalAmount += price * product.quantity;
  }

  const newOrder = await OrderModel.create({
    user_id,
    products: productsToCheckout.map((product) => {
      const { checkout, ...rest } = product._doc;
      return rest;
    }),
    total_price: totalAmount,
  });

  cart.products = [];
  cart.product_count = 0;
  await cart.save();

  return res.json({ data: { order: newOrder } });
});

app.get('/api/orders', async (req, res, next) => {
  const orders = req.query?.state
    ? await OrderModel.find({
        user_id: req.id,
        state: req.query.state,
      }).sort({ createdAt: -1 })
    : await OrderModel.find({ user_id: req.id }).sort({ createdAt: -1 });
  console.log(orders);

  const orderDetails = await Promise.all(
    orders.map(async (order) => {
      const products = await Promise.all(
        order.products.map(async (product) => {
          const pDetail = await ProductModel.findOne({ _id: product.product_id }).select('name');
          const variants = await VariantModel.find({ product: product.product_id });
          const pickedV = variants.find((v) => v._id.toString() === product.variant_id);
          return {
            ...pDetail._doc,
            price: pickedV.price,
            thumb_url: pickedV.thumb_url,
            quantity: product.quantity,
            variant: Object.values(pickedV.options).join(', '),
            variant_id: pickedV._id,
          };
        }),
      );

      return { ...order._doc, products };
    }),
  );

  return res.json({
    data: {
      orders: orderDetails,
    },
  });
});

app.use((error, req, res, next) => {
  console.log(error);
  const status = error?.status || 500;
  const code = error?.code || status;
  const message = error?.message || 'Internal Server Error';
  return res.status(status).json({
    code,
    status,
    message,
  });
});

app.listen(8080, () => {
  console.log('http://localhost:8080');
});
