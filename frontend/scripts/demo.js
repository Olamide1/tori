// Predefined mappings of plain English inputs to SQL queries
const demoMappings = {
    "show all users": `
      SELECT * FROM users;
    `,
    "list all orders in january 2024": `
      SELECT * FROM orders WHERE MONTH(order_date) = 1 AND YEAR(order_date) = 2024;
    `,
    "show all orders with user details": `
      SELECT orders.id, users.name, orders.order_date, orders.amount
      FROM orders
      INNER JOIN users ON orders.user_id = users.id;
    `,
    "show total amount spent by each user": `
      SELECT users.name, SUM(orders.amount) AS total_spent
      FROM users
      INNER JOIN orders ON users.id = orders.user_id
      GROUP BY users.name;
    `,
    "what is the most expensive product sold": `
      SELECT name, price
      FROM products
      WHERE price = (SELECT MAX(price) FROM products);
    `,
    "list all products sold in 2023": `
      SELECT products.name, orders.amount, orders.order_date
      FROM orders
      INNER JOIN products ON orders.product_id = products.id
      WHERE YEAR(orders.order_date) = 2023;
    `,
    "show the total revenue in 2023": `
      SELECT SUM(orders.amount) AS total_revenue
      FROM orders
      WHERE YEAR(order_date) = 2023;
    `,
    "show all users registered after january 2023": `
      SELECT * FROM users WHERE registered_at > '2023-01-01';
    `,
    "list users with no orders": `
      SELECT users.name
      FROM users
      LEFT JOIN orders ON users.id = orders.user_id
      WHERE orders.user_id IS NULL;
    `,
    "find all orders above $100": `
      SELECT * FROM orders WHERE amount > 100;
    `,
    "list products not sold in 2023": `
      SELECT products.name
      FROM products
      LEFT JOIN orders ON products.id = orders.product_id
      WHERE YEAR(orders.order_date) != 2023 OR orders.order_date IS NULL;
    `,
    "list orders by user bob": `
      SELECT orders.id, orders.amount, orders.order_date
      FROM orders
      INNER JOIN users ON orders.user_id = users.id
      WHERE users.name = 'Bob';
    `,
    "find the user who spent the most": `
      SELECT users.name, SUM(orders.amount) AS total_spent
      FROM users
      INNER JOIN orders ON users.id = orders.user_id
      GROUP BY users.name
      ORDER BY total_spent DESC
      LIMIT 1;
    `,
    "show revenue grouped by month in 2023": `
      SELECT MONTH(order_date) AS month, SUM(amount) AS revenue
      FROM orders
      WHERE YEAR(order_date) = 2023
      GROUP BY MONTH(order_date);
    `,
    "list all products with no orders": `
      SELECT name
      FROM products
      LEFT JOIN orders ON products.id = orders.product_id
      WHERE orders.product_id IS NULL;
    `,
    "find all orders on christmas": `
      SELECT * FROM orders WHERE MONTH(order_date) = 12 AND DAY(order_date) = 25;
    `,
    "show all users who registered in 2023": `
      SELECT * FROM users WHERE YEAR(registered_at) = 2023;
    `,
    "show the cheapest product": `
      SELECT name, price
      FROM products
      WHERE price = (SELECT MIN(price) FROM products);
    `,
    "list all users with more than 5 orders": `
      SELECT users.name, COUNT(orders.id) AS order_count
      FROM users
      INNER JOIN orders ON users.id = orders.user_id
      GROUP BY users.name
      HAVING order_count > 5;
    `,
    "find the average order amount": `
      SELECT AVG(amount) AS average_order_amount
      FROM orders;
    `,
    "list users who spent less than $50": `
      SELECT users.name
      FROM users
      INNER JOIN orders ON users.id = orders.user_id
      GROUP BY users.name
      HAVING SUM(orders.amount) < 50;
    `,
    "find products sold more than 10 times": `
      SELECT products.name, COUNT(orders.id) AS sold_count
      FROM products
      INNER JOIN orders ON products.id = orders.product_id
      GROUP BY products.name
      HAVING sold_count > 10;
    `,
    "show all orders with a discount": `
      SELECT * FROM orders WHERE discount IS NOT NULL;
    `,
    "list users who registered in december": `
      SELECT * FROM users WHERE MONTH(registered_at) = 12;
    `,
    "show the total number of orders": `
      SELECT COUNT(*) AS total_orders FROM orders;
    `,
    "find the product with the highest revenue": `
      SELECT products.name, SUM(orders.amount) AS total_revenue
      FROM products
      INNER JOIN orders ON products.id = orders.product_id
      GROUP BY products.name
      ORDER BY total_revenue DESC
      LIMIT 1;
    `,
    "list all products priced above $50": `
      SELECT * FROM products WHERE price > 50;
    `,
    "find users with at least one order in 2023": `
      SELECT DISTINCT users.name
      FROM users
      INNER JOIN orders ON users.id = orders.user_id
      WHERE YEAR(orders.order_date) = 2023;
    `,
    "list all orders sorted by amount": `
      SELECT * FROM orders ORDER BY amount DESC;
    `,
    "show users who placed orders in january": `
      SELECT DISTINCT users.name
      FROM users
      INNER JOIN orders ON users.id = orders.user_id
      WHERE MONTH(orders.order_date) = 1;
    `,
    "find all users who have purchased a product named 'Laptop'": `
      SELECT DISTINCT users.name
      FROM users
      INNER JOIN orders ON users.id = orders.user_id
      INNER JOIN products ON orders.product_id = products.id
      WHERE products.name = 'Laptop';
    `,
    "list all orders along with product names": `
      SELECT orders.id, products.name, orders.amount, orders.order_date
      FROM orders
      INNER JOIN products ON orders.product_id = products.id;
    `,
    "show total orders for each product": `
      SELECT products.name, COUNT(orders.id) AS total_orders
      FROM products
      INNER JOIN orders ON products.id = orders.product_id
      GROUP BY products.name;
    `,
    "find products sold on january 15, 2023": `
      SELECT DISTINCT products.name
      FROM products
      INNER JOIN orders ON products.id = orders.product_id
      WHERE orders.order_date = '2023-01-15';
    `,
    "show all orders made by users with gmail accounts": `
      SELECT orders.*
      FROM orders
      INNER JOIN users ON orders.user_id = users.id
      WHERE users.email LIKE '%@gmail.com';
    `,
    "show all sales in 2020": `
    SELECT * FROM sales WHERE YEAR(sale_date) = 2020;
  `,
  "show all sales in 2021": `
    SELECT * FROM sales WHERE YEAR(sale_date) = 2021;
  `,
  "show all sales in 2022": `
    SELECT * FROM sales WHERE YEAR(sale_date) = 2022;
  `,
  // Default for unsupported years
  "show all sales in [year]": `
    SELECT * FROM sales WHERE YEAR(sale_date) = [year];
  `,
  };
  
  
  // Predefined results for the queries
  const demoResults = {
    "show all users": `
      | id | name   | email             | registered_at |
      |----|--------|-------------------|---------------|
      | 1  | Alice  | alice@example.com | 2023-01-15    |
      | 2  | Bob    | bob@example.com   | 2023-06-10    |
    `,
    "list all orders in january 2024": `
      | id | user_id | order_date | amount |
      |----|---------|------------|--------|
      | 1  | 2       | 2024-01-03 | 100.00 |
    `,
    "show all orders with user details": `
      | id | name   | order_date | amount |
      |----|--------|------------|--------|
      | 1  | Bob    | 2024-01-03 | 100.00 |
    `,
    "show total amount spent by each user": `
      | name   | total_spent |
      |--------|-------------|
      | Bob    | 200.00      |
    `,
    "what is the most expensive product sold": `
      | name        | price |
      |-------------|-------|
      | Premium Bag | 150.00|
    `,
    "list all products sold in 2023": `
      | name       | amount | order_date |
      |------------|--------|------------|
      | Bag        | 50.00  | 2023-07-15 |
      | Shoes      | 70.00  | 2023-08-20 |
    `,
    "show the total revenue in 2023": `
      | total_revenue |
      |---------------|
      | 5000.00       |
    `,
    "show all users registered after january 2023": `
      | id | name   | email             | registered_at |
      |----|--------|-------------------|---------------|
      | 2  | Bob    | bob@example.com   | 2023-06-10    |
    `,
    "list users with no orders": `
      | name  |
      |-------|
      | Alice |
    `,
    "find all orders above $100": `
      | id | user_id | order_date | amount |
      |----|---------|------------|--------|
      | 2  | 3       | 2023-02-10 | 120.00 |
    `,
    "list products not sold in 2023": `
      | name       |
      |------------|
      | Headphones |
    `,
    "list orders by user bob": `
      | id | amount | order_date |
      |----|--------|------------|
      | 1  | 100.00 | 2024-01-03 |
    `,
    "find the user who spent the most": `
      | name   | total_spent |
      |--------|-------------|
      | Bob    | 300.00      |
    `,
    "show revenue grouped by month in 2023": `
      | month | revenue |
      |-------|---------|
      | 1     | 300.00  |
      | 7     | 500.00  |
    `,
    "list all products with no orders": `
      | name       |
      |------------|
      | Accessories |
    `,
    "find all orders on christmas": `
      | id | user_id | order_date | amount |
      |----|---------|------------|--------|
      | 10 | 4       | 2023-12-25 | 200.00 |
    `,
    "show all users who registered in 2023": `
      | id | name   | email             | registered_at |
      |----|--------|-------------------|---------------|
      | 2  | Bob    | bob@example.com   | 2023-06-10    |
    `,
    "show the cheapest product": `
      | name       | price |
      |------------|-------|
      | Notebook   | 5.00  |
    `,
    "list all users with more than 5 orders": `
      | name   | order_count |
      |--------|-------------|
      | Alice  | 6           |
    `,
    "find the average order amount": `
      | average_order_amount |
      |----------------------|
      | 75.00                |
    `,
    "list users who spent less than $50": `
      | name   |
      |--------|
      | Alice  |
    `,
    "find products sold more than 10 times": `
      | name       | sold_count |
      |------------|------------|
      | Backpack   | 15         |
    `,
    "show all orders with a discount": `
      | id | user_id | order_date | amount | discount |
      |----|---------|------------|--------|----------|
      | 1  | 2       | 2023-05-20 | 90.00  | 10%      |
    `,
    "list users who registered in december": `
      | id | name    | email             | registered_at |
      |----|---------|-------------------|---------------|
      | 3  | Charlie | charlie@example.com | 2023-12-15  |
    `,
    "show the total number of orders": `
      | total_orders |
      |--------------|
      | 50           |
    `,
    "find the product with the highest revenue": `
      | name       | total_revenue |
      |------------|---------------|
      | Laptop     | 3000.00       |
    `,
    "list all products priced above $50": `
      | name       | price |
      |------------|-------|
      | Laptop     | 1000  |
      | Smartphone | 800   |
    `,
    "find users with at least one order in 2023": `
      | name   |
      |--------|
      | Bob    |
    `,
    "list all orders sorted by amount": `
      | id | amount | user_id |
      |----|--------|---------|
      | 3  | 300.00 | 1       |
      | 4  | 200.00 | 2       |
    `,
    "show users who placed orders in january": `
      | name   |
      |--------|
      | Alice  |
    `,
    "find all users who have purchased a product named 'Laptop'": `
      | name   |
      |--------|
      | Bob    |
    `,
    "list all orders along with product names": `
      | id | name       | amount | order_date |
      |----|------------|--------|------------|
      | 1  | Laptop     | 1000.00 | 2023-01-20 |
    `,
    "show total orders for each product": `
      | name       | total_orders |
      |------------|--------------|
      | Laptop     | 20           |
    `,
    "find products sold on january 15, 2023": `
      | name       |
      |------------|
      | Smartphone |
    `,
    "show all orders made by users with gmail accounts": `
      | id | user_id | amount | order_date |
      |----|---------|--------|------------|
      | 1  | 2       | 500    | 2023-06-10 |
    `,
    "show all sales in 2020": `
    | id | product   | sale_date  | amount |
    |----|-----------|------------|--------|
    | 1  | Widget A  | 2020-05-12 | 150.00 |
    | 2  | Widget B  | 2020-11-23 | 200.00 |
  `,
  "show all sales in 2021": `
    | id | product   | sale_date  | amount |
    |----|-----------|------------|--------|
    | 3  | Widget C  | 2021-03-15 | 300.00 |
    | 4  | Widget D  | 2021-08-19 | 400.00 |
  `,
  "show all sales in 2022": `
    | id | product   | sale_date  | amount |
    |----|-----------|------------|--------|
    | 5  | Widget E  | 2022-01-10 | 500.00 |
    | 6  | Widget F  | 2022-09-29 | 600.00 |
  `,
  };
  
  
  // Helper function: Calculate Levenshtein distance
  const calculateLevenshtein = (a, b) => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
  
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
        else dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  
    return dp[a.length][b.length];
  };
  
  // Find the closest matching query
  const findClosestMatch = (input) => {
    const yearMatch = input.match(/show all sales in (\d{4})/);
    if (yearMatch) {
      const year = yearMatch[1];
      if (demoMappings[`show all sales in ${year}`]) {
        return `show all sales in ${year}`;
      }
      return demoMappings["show all sales in [year]"].replace("[year]", year);
    }
  
    const keys = Object.keys(demoMappings);
    let closestMatch = null;
    let minDistance = Infinity;
  
    keys.forEach((key) => {
      const distance = calculateLevenshtein(input, key);
      if (distance < minDistance) {
        minDistance = distance;
        closestMatch = key;
      }
    });
  
    return minDistance <= 3 ? closestMatch : null;
  };
  
  
  // Attach event listener to the demo run button
  document.addEventListener("DOMContentLoaded", () => {
    const runButton = document.getElementById("demo-run-btn");
    const inputField = document.getElementById("demo-query-input");
    const generatedSqlOutput = document.getElementById("demo-generated-sql");
    const queryResultOutput = document.getElementById("demo-query-result");
  
    runButton.addEventListener("click", () => {
      const inputQuery = inputField.value.trim().toLowerCase();
  
      if (demoMappings[inputQuery]) {
        // Exact match
        generatedSqlOutput.textContent = demoMappings[inputQuery];
        queryResultOutput.textContent = demoResults[inputQuery];
      } else {
        const closestMatch = findClosestMatch(inputQuery);
        if (closestMatch) {
          // Suggest the closest match
          generatedSqlOutput.textContent = `-- Did you mean: "${closestMatch}"?\n${demoMappings[closestMatch]}`;
          queryResultOutput.textContent = demoResults[closestMatch];
        } else {
          // Fallback response
          generatedSqlOutput.textContent = "-- Unable to generate SQL for the input provided.";
          queryResultOutput.textContent = "-- No results found.";
        }
      }
    });
  });
  