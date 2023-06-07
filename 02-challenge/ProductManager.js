const fs = require("fs");

class ProductManager {
  constructor(path) {
    this.path = path;
  }

  #areFieldsValid({ title, description, price, thumbnail, code, stock }) {
    if (typeof title !== "string" || !title) return false;
    if (typeof description !== "string" || !description) return false;
    if (typeof price !== "number") return false;
    if (typeof thumbnail !== "string" || !thumbnail) return false;
    if (typeof code !== "string" || !code) return false;
    if (typeof stock !== "number") return false;

    return true;
  }

  #isCodeUnique(code, products) {
    return !products.some((product) => product.code === code);
  }

  #generateId(products) {
    return (
      products.reduce(
        (maxId, product) => (product.id > maxId ? product.id : maxId),
        0
      ) + 1
    );
  }

  #checkIfProductExists(id, products) {
    return products.some((product) => product.id === id);
  }

  async #saveProductsToFile(products) {
    await fs.promises.writeFile(this.path, JSON.stringify(products));
  }

  async #getProductsFromFile() {
    if (fs.existsSync(this.path)) {
      const productsJSON = await fs.promises.readFile(this.path, "utf-8");

      return JSON.parse(productsJSON);
    } else return [];
  }

  async getProducts() {
    try {
      const products = await this.#getProductsFromFile();

      return products;
    } catch (error) {
      console.error("Error getting the products:" + error);
    }
  }

  async addProduct(product) {
    try {
      const products = await this.#getProductsFromFile();

      if (!this.#areFieldsValid(product)) {
        console.error("Invalid fields");
        return;
      }

      if (!this.#isCodeUnique(product.code, products)) {
        console.error("Code already exists");
        return;
      }

      const newProduct = {
        ...product,
        id: this.#generateId(products),
      };

      products.push(newProduct);

      await this.#saveProductsToFile(products);

      return newProduct;
    } catch (error) {
      console.error("Error adding the product:" + error);
    }
  }

  async getProductById(id) {
    try {
      const products = await this.#getProductsFromFile();

      const product = products.find((product) => product.id === id);

      if (product) return product;

      console.log("Not Found");
    } catch (error) {
      console.error("Error getting the product:" + error);
    }
  }

  async updateProduct(id, partialProduct) {
    try {
      const products = await this.#getProductsFromFile();
      const productToUpdate = await this.getProductById(id);

      const newProduct = {
        ...productToUpdate,
        ...partialProduct,
        id: productToUpdate.id,
      };

      if (
        partialProduct.code &&
        !this.#isCodeUnique(partialProduct.code, products)
      ) {
        console.error("Code already exists");
        return;
      }

      const newProducts = products.map((product) =>
        product.id === id ? newProduct : product
      );

      await this.#saveProductsToFile(newProducts);
    } catch (error) {
      console.error("Error updating the product:" + error);
    }
  }

  async deleteProduct(id) {
    try {
      const products = await this.#getProductsFromFile();
      const productExists = this.#checkIfProductExists(id, products);

      if (!productExists) {
        console.log("Not Found");
        return;
      }

      const filteredProducts = products.filter((product) => product.id !== id);
      await this.#saveProductsToFile(filteredProducts);
    } catch (error) {
      console.log("Error deleting the product: " + error);
    }
  }
}

(async () => {
  const path = "./products.json";

  // Delete file if exists
  try {
    if (fs.existsSync(path)) await fs.promises.unlink(path);
  } catch (error) {
    console.error(error);
  }

  const manager = new ProductManager(path);

  console.log("getProducts()");
  console.log(await manager.getProducts());

  console.log("addProduct()");
  await manager.addProduct({
    title: "Producto Prueba",
    description: "Este es un producto de prueba",
    price: 200,
    thumbnail: "Sin imagen",
    code: "abc123",
    stock: 25,
  });

  console.log("addProduct()");
  await manager.addProduct({
    title: "Producto Prueba 2",
    description: "Este es un producto de prueba 2",
    price: 300,
    thumbnail: "Sin imagen",
    code: "abc1234",
    stock: 30,
  });

  console.log("getProducts()");
  console.log(await manager.getProducts());

  console.log("getProductById(1)");
  console.log(await manager.getProductById(1));

  console.log("getProductById(3)"); // Not found
  console.log(await manager.getProductById(3));

  console.log("getProducts()");
  console.log(await manager.getProducts());

  console.log(
    "updateProduct(1, { id: 1000, title: 'Producto Prueba Editado', stock: 100 })"
  );
  await manager.updateProduct(1, {
    id: 1000,
    title: "Producto Prueba Editado",
    stock: 100,
  });

  console.log("getProducts()");
  console.log(await manager.getProducts());

  console.log("deleteProduct(1)");
  await manager.deleteProduct(1);

  console.log("getProducts()");
  console.log(await manager.getProducts());

  console.log("deleteProduct(3)"); // Not found
  await manager.deleteProduct(3);

  console.log("getProducts()");
  console.log(await manager.getProducts());
})();
