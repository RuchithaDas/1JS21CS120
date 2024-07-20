const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();

const apiurl = "http://20.244.56.144/test/companies";

const cache = {};

const categories = [
  "Phone", "Computer", "TV", "Earphone", "Tablet", "Charger", 
  "Mouse", "Keypad", "Bluetooth", "Pendrive", "Remote", 
  "Speaker", "Headset", "Laptop", "PC"
];

const product_fetch = async (company, category, minPrice, maxPrice, top) => {
  const url = ${apiurl}/${company}/categories/${category}/products?top=${top}&minPrice=${minPrice}&maxPrice=${maxPrice};
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(An Error Occured ${url});
  }
  const data = await response.json();
  return data.map(product => ({
    id: uuidv4(),
    productName: product.productName,
    price: product.price,
    rating: product.rating,
    discount: product.discount,
    availability: product.availability
  }));
};

app.get('/categories/:category/products', async (req, res) => {
  const { category } = req.params;
  const n = parseInt(req.query.n, 10) || 10;
  const minPrice = parseFloat(req.query.minPrice) || 0;
  const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
  const sortBy = req.query.sort_by || 'price';
  const order = req.query.order || 'asc';
  const companies = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZP'];

  if (!categories.includes(category)) {
    return res.status(400).json({ error: 'category is not there' });
  }

  const cacheKey = ${category}:${n}:${minPrice}:${maxPrice}:${sortBy}:${order};
  if (cache[cacheKey]) {
    return res.json(cache[cacheKey]);
  }

  try {
    const products = [];
    for (const company of companies) {
      const companyProducts = await product_fetch(company, category, minPrice, maxPrice, n);
      products.push(...companyProducts);
    }

    products.sort((a, b) => {
      if (order === 'asc') {
        return a[sortBy] - b[sortBy];
      } else {
        return b[sortBy] - a[sortBy];
      }
    });

    const topProducts = products.slice(0, n);
    cache[cacheKey] = topProducts;
    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/categories/:category/products/:productId', async (req, res) => {
  const { category, productId } = req.params;

  if (!categories.includes(category)) {
    return res.status(400).json({ error: 'not valid category' });
  }

  for (const company of ['AMZ', 'FLP', 'SNP', 'MYN', 'AZP']) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(${apiurl}/${company}/categories/${category}/products/${productId});
      if (response.ok) {
        const product = await response.json();
        return res.json({
          id: productId,
          productName: product.productName,
          price: product.price,
          rating: product.rating,
          discount: product.discount,
          availability: product.availability
        });
      }
    } catch (error) {
      console.error(An Error ocurred failed to get data ${company}:, error);
    }
  }

  res.status(404).json({ error: 'Product not found' });
});

const port = 3000;
app.listen(port, () => {
  console.log(Server running at http://localhost:${port});
});