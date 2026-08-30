import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import glassProduct from './assets/glass-product.jpg'
import './App.css'

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  category: string;
};

const product: Product = {
  id: 1,
  name: "Premium Etched Glass Panel",
  description:
    "Elegant decorative glass panel designed for modern homes, offices and commercial spaces.",
  price: 500,
  mrp: 650,
  stock: 20,
  category: "Decorative Glass",
};

function App() {
  const [page, setPage] = useState("home");
  const [loginMode, setLoginMode] = useState("login");
  const [accountType, setAccountType] = useState("Customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [, setCart] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    mrp: "",
    offer_price: "",
    stock: "",
    category: "",
  });
  const addToCart = (product: any) => {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
              ...item,
              quantity: item.quantity + 1,
            }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };
  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading products:", error);
      return;
    }

    setProducts(data || []);
  };
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      setUser(data.user);

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    getUser();
    loadProducts();
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          setUserRole(profile?.role ?? "");
        } else {
          setUserRole("");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
  const handleAuth = async () => {
    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    if (loginMode === "register") {
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: email,
            role: accountType.toLowerCase(),
            points: 0,
          });

        if (profileError) {
          alert(profileError.message);
          return;
        }
      }

      alert(
        "Account created successfully! Please check your email to verify your account."
      );

      setLoginMode("login");
      setPassword("");
      setConfirmPassword("");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        alert("Could not load your account details.");
        return;
      }

      setUserRole(profile.role);

      alert("Login successful!");

      if (profile.role === "admin") {
        setPage("admin");
      } else {
        setPage("home");
      }
    }
  };
  

  const cartTotal = cartQuantity * product.price;

  const increaseCartQuantity = () => {
    if (cartQuantity < product.stock) {
      setCartQuantity(cartQuantity + 1);
    }
  };

  const removeFromCart = () => {
    if (cartQuantity > 0) {
      setCartQuantity(cartQuantity - 1);
    }
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo" onClick={() => setPage(userRole === "admin" ? "admin" : "home")}>
          <span>GLASS</span>MART
        </div>

        {userRole === "admin" ? (
          <button onClick={() => setPage("admin")}>
            Dashboard
          </button>
        ) : (
          <>
            <button onClick={() => setPage("home")}>Home</button>
            <button onClick={() => setPage("products")}>Products</button>
            <button onClick={() => setPage("services")}>Services</button>
            <button onClick={() => setPage("contact")}>Contact</button>
          </>
        )}

        <div className="nav-right">
          {user ? (
            <button
              className="login-btn"
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
                setPage("home");
              }}
            >
              Logout
            </button>
          ) : (
            <button className="login-btn" onClick={() => setPage("login")}>
              Login
            </button>
          )}

          {userRole !== "admin" && (
            <button className="cart-btn" onClick={() => setPage("cart")}>
              🛒 Cart
              {cartQuantity > 0 && (
                <span className="cart-count">{cartQuantity}</span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* HOME */}
      {page === "home" && (
        <main>
          <section className="hero">
            <div className="hero-content">
              <p className="eyebrow">PREMIUM GLASS SOLUTIONS</p>

              <h1>
                Glass that makes
                <br />
                <span>spaces beautiful.</span>
              </h1>

              <p className="hero-text">
                Discover premium decorative glass for homes, restaurants,
                offices and commercial spaces.
              </p>

              <div className="hero-buttons">
                <button
                  className="primary-btn"
                  onClick={() => setPage("products")}
                >
                  Explore Products →
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => setPage("services")}
                >
                  Request a Quote
                </button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="glass-card">
                <img
                  src={glassProduct}
                  alt="Premium decorative glass"
                />
                <div className="glass-overlay">
                  <p>PREMIUM</p>
                  <h3>DECORATIVE<br />GLASS</h3>
                </div>
              </div>
            </div>
          </section>

          <section className="categories">
            <div className="section-heading">
              <p className="eyebrow">EXPLORE</p>
              <h2>Our Glass Collection</h2>
              <p>Quality glass solutions for every space.</p>
            </div>

            <div className="category-grid">
              <div className="category-card">
                <div>◈</div>
                <h3>Decorative Glass</h3>
                <p>Elegant designs for interiors.</p>
              </div>

              <div className="category-card">
                <div>▥</div>
                <h3>Partition Glass</h3>
                <p>Modern solutions for offices.</p>
              </div>

              <div className="category-card">
                <div>◇</div>
                <h3>Designer Glass</h3>
                <p>Premium glass for unique spaces.</p>
              </div>

              <div className="category-card">
                <div>▦</div>
                <h3>Custom Glass</h3>
                <p>Made according to your needs.</p>
              </div>
            </div>
          </section>

          <section className="featured">
            <div className="section-heading">
              <p className="eyebrow">FEATURED</p>
              <h2>Popular Product</h2>
            </div>

            <div className="featured-product">
              <div className="product-image large">
                <div className="glass-pattern"></div>
                <span>GLASSMART</span>
              </div>

              <div className="product-info">
                <p className="product-category">{product.category}</p>
                <h2>{product.name}</h2>
                <p>{product.description}</p>

                <div className="price">
                  <strong>₹{product.price}</strong>
                  <del>₹{product.mrp}</del>
                </div>

                <button className="primary-btn" onClick={increaseCartQuantity}>
                  Add to Cart
                </button>
              </div>
            </div>
          </section>
        
          <section className="about">
            <div>
              <p className="eyebrow">ABOUT GLASSMART</p>
              <h2>Designed for modern spaces.</h2>
            </div>

            <p>
              Glassmart provides quality glass products and solutions for
              residential, commercial and hospitality projects. From
              decorative glass to custom installations, we help transform
              ordinary spaces into something special.
            </p>
          </section>
        </main>
      )}
      {/* Admin page*/}

      {page === "admin" && userRole === "admin" && (
        <main className="page-container">
          <div className="admin-dashboard">
            <p className="eyebrow">GLASSMART ADMIN</p>

            <h1>Admin Dashboard</h1>

            <p>
              Welcome to the Glassmart management portal.
            </p>

            <div className="admin-grid">
              <div
                className="admin-card"
                onClick={() => setPage("admin-products")}
              >
                <h2>Products</h2>
                <p>Manage products and pricing.</p>
              </div>

              <div className="admin-card">
                <h3>Orders</h3>
                <p>Track customer orders.</p>
              </div>

              <div className="admin-card">
                <h3>Quotations</h3>
                <p>View service enquiries.</p>
              </div>

              <div className="admin-card">
                <h3>Customers</h3>
                <p>View customer accounts and points.</p>
              </div>
            </div>
          </div>
        </main>
      )}
      {page === "admin-products" && userRole === "admin" && (
        <main className="page-container admin-products-page">
          <div className="admin-dashboard">

            <p className="eyebrow">GLASSMART ADMIN</p>

            <div className="admin-page-header">
              <div>
                <h1>Products</h1>
                <p>Manage your products, prices and offers.</p>
              </div>

              <button
                className="primary-btn"
                onClick={() => setShowAddProduct(true)}
              >
                + Add Product
              </button>
            </div>
            {showAddProduct && (
              <div className="edit-product-box">
                <h2>Add Product</h2>

                <input
                  type="text"
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="MRP"
                  value={newProduct.mrp}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      mrp: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Offer price"
                  value={newProduct.offer_price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      offer_price: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Stock"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stock: e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  placeholder="Category"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category: e.target.value,
                    })
                  }
                />

                <div className="edit-product-actions">
                  <button
                    className="primary-btn"
                    onClick={async () => {
                      if (
                        !newProduct.name ||
                        !newProduct.mrp ||
                        !newProduct.offer_price
                      ) {
                        alert("Please fill product name and prices.");
                        return;
                      }

                      const { data, error } = await supabase
                        .from("products")
                        .insert({
                          name: newProduct.name,
                          description: newProduct.description,
                          mrp: Number(newProduct.mrp),
                          offer_price: Number(newProduct.offer_price),
                          stock: Number(newProduct.stock) || 0,
                          category: newProduct.category,
                        })
                        .select()
                        .single();

                      if (error) {
                        alert(error.message);
                        return;
                      }

                      setProducts((current) => [data, ...current]);

                      setNewProduct({
                        name: "",
                        description: "",
                        mrp: "",
                        offer_price: "",
                        stock: "",
                        category: "",
                      });

                      setShowAddProduct(false);

                      alert("Product added successfully!");
                    }}
                  >
                    Add Product
                  </button>

                  <button onClick={() => setShowAddProduct(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {editingProduct && (
              <div className="edit-product-box">
                <h2>Edit Product</h2>

                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                  placeholder="Product name"
                />

                <input
                  type="number"
                  value={editingProduct.mrp}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      mrp: Number(e.target.value),
                    })
                  }
                  placeholder="MRP"
                />

                <input
                  type="number"
                  value={editingProduct.offer_price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      offer_price: Number(e.target.value),
                    })
                  }
                  placeholder="Offer price"
                />

                <input
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock: Number(e.target.value),
                    })
                  }
                  placeholder="Stock"
                />

                <div className="edit-product-actions">
                  <button
                    className="primary-btn"
                    onClick={async () => {
                      const { error } = await supabase
                        .from("products")
                        .update({
                          name: editingProduct.name,
                          mrp: editingProduct.mrp,
                          offer_price: editingProduct.offer_price,
                          stock: editingProduct.stock,
                        })
                        .eq("id", editingProduct.id);

                      if (error) {
                        alert(error.message);
                        return;
                      }

                      setProducts((current) =>
                        current.map((product) =>
                          product.id === editingProduct.id
                            ? editingProduct
                            : product
                        )
                      );

                      setEditingProduct(null);

                      alert("Product updated successfully!");
                    }}
                  >
                    Save Changes
                  </button>

                  <button
                    onClick={() => setEditingProduct(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="product-admin-table">

              <div className="product-admin-row product-admin-heading">
                <span>Product</span>
                <span>MRP</span>
                <span>Offer Price</span>
                <span>Stock</span>
                <span>Actions</span>
              </div>

              {products.map((product) => (
                <div className="product-admin-row" key={product.id}>
                  <span>{product.name}</span>

                  <span>₹{product.mrp}</span>

                  <span>₹{product.offer_price}</span>

                  <span>{product.stock}</span>

                  <div className="admin-actions">
                    <button onClick={() => setEditingProduct(product)}>
                      Edit
                    </button>

                    <button
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Are you sure you want to delete "${product.name}"?`
                        );

                        if (!confirmed) return;

                        const { error } = await supabase
                          .from("products")
                          .delete()
                          .eq("id", product.id);

                        if (error) {
                          alert(error.message);
                          return;
                        }

                        setProducts((current) =>
                          current.filter((item) => item.id !== product.id)
                        );

                        alert("Product deleted successfully!");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

            </div>

            <button
              className="back-btn"
              onClick={() => setPage("admin")}
            >
              ← Back to Dashboard
            </button>

          </div>
        </main>
      )}
      {/* PRODUCTS */}
      {page === "products" && (
        <main className="page-container products-page">
          <div className="products-header">
            <p className="eyebrow">GLASSMART PRODUCTS</p>

            <h1>Our Products</h1>

            <p>
              Browse our collection and add products to your cart.
            </p>
          </div>

          <div className="products-grid">
            {products.map((product) => (
              <div className="product-card" key={product.id}>
                <div className="product-image">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                    />
                  ) : (
                    <span>No Image</span>
                  )}
                </div>

                <div className="product-info">
                  <p className="product-category">
                    {product.category || "Glass"}
                  </p>

                  <h2>{product.name}</h2>

                  <p className="product-description">
                    {product.description || "Premium quality glass product."}
                  </p>

                  <div className="product-pricing">
                    <span className="product-mrp">
                      ₹{product.mrp}
                    </span>

                    <span className="product-offer">
                      ₹{product.offer_price}
                    </span>
                  </div>

                  <p className="product-stock">
                    {product.stock > 0
                      ? `${product.stock} available`
                      : "Out of stock"}
                  </p>

                  <button
                    className="primary-btn full"
                    disabled={product.stock <= 0}
                    onClick={() => addToCart(product)}
                  >
                    {product.stock > 0
                      ? "Add to Cart"
                      : "Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* CART */}
      {page === "cart" && (
        <main className="page-container">
          <div className="page-title">
            <p className="eyebrow">YOUR SHOPPING CART</p>
            <h1>Cart</h1>
          </div>

          {cartQuantity === 0 ? (
            <div className="empty-state">
              <div>🛒</div>
              <h2>Your cart is empty</h2>
              <p>Add a product to get started.</p>

              <button
                className="primary-btn"
                onClick={() => setPage("products")}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-item">
                <div className="product-image small">
                  <div className="glass-pattern"></div>
                </div>

                <div className="cart-product-info">
                  <p className="product-category">{product.category}</p>
                  <h2>{product.name}</h2>
                  <p>₹{product.price} each</p>

                  <div className="quantity">
                    <button onClick={removeFromCart}>−</button>
                    <span>{cartQuantity}</span>
                    <button onClick={addToCart}>+</button>
                  </div>
                </div>

                <strong>₹{cartTotal}</strong>
              </div>

              <div className="summary">
                <h2>Order Summary</h2>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>

                <div className="summary-row">
                  <span>Delivery</span>
                  <span>Calculated later</span>
                </div>

                <hr />

                <div className="summary-total">
                  <span>Total</span>
                  <strong>₹{cartTotal}</strong>
                </div>

                <button
                  className="primary-btn full"
                  onClick={() => setPage("checkout")}
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* CHECKOUT */}
      {page === "checkout" && (
        <main className="page-container">
          <div className="page-title">
            <p className="eyebrow">CHECKOUT</p>
            <h1>Complete Your Order</h1>
          </div>

          <div className="checkout-layout">
            <div className="checkout-form">
              <h2>Customer Details</h2>

              <label>Name</label>
              <input placeholder="Enter your name" />

              <label>Email</label>
              <input type="email" placeholder="Enter your email" />

              <label>Phone</label>
              <input placeholder="Enter phone number" />

              <label>Delivery Address</label>
              <textarea placeholder="Enter delivery address"></textarea>

              <h2>Payment Method</h2>

              <div className="payment-option">
                <input type="radio" defaultChecked name="payment" />
                <div>
                  <strong>UPI</strong>
                  <p>Pay directly using UPI / QR</p>
                </div>
              </div>

              <div className="payment-option">
                <input type="radio" name="payment" />
                <div>
                  <strong>Card</strong>
                  <p>Pay securely using card</p>
                </div>
              </div>

              <button
                className="primary-btn full"
                onClick={() => setPage("confirmation")}
              >
                Pay ₹{cartTotal} →
              </button>
            </div>

            <div className="summary">
              <h2>Your Order</h2>

              <p>
                {product.name} × {cartQuantity}
              </p>

              <div className="summary-total">
                <span>Total</span>
                <strong>₹{cartTotal}</strong>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* CONFIRMATION */}
      {page === "confirmation" && (
        <main className="page-container">
          <div className="success">
            <div className="success-icon">✓</div>
            <p className="eyebrow">ORDER PLACED</p>
            <h1>Thank you for your order!</h1>

            <p>
              Your order <strong>#GM1001</strong> has been received.
            </p>

            <div className="order-box">
              <div>
                <span>Product</span>
                <strong>{product.name}</strong>
              </div>

              <div>
                <span>Quantity</span>
                <strong>{cartQuantity}</strong>
              </div>

              <div>
                <span>Total</span>
                <strong>₹{cartTotal}</strong>
              </div>

              <div>
                <span>Payment</span>
                <strong className="paid">PAID</strong>
              </div>
            </div>

            <button
              className="primary-btn"
              onClick={() => setPage("home")}
            >
              Back to Home
            </button>
          </div>
        </main>
      )}

      {/* SERVICES */}
      {page === "services" && (
        <main className="page-container">
          <div className="page-title">
            <p className="eyebrow">OUR SERVICES</p>
            <h1>Need a Custom Solution?</h1>
            <p>Tell us what you need and our team will get back to you.</p>
          </div>

          <div className="service-layout">
            <div className="service-info">
              <h2>Request a Quote</h2>
              <p>
                Whether you're working on a home, restaurant, office or
                commercial project, tell us about your requirements.
              </p>
            </div>

            <div className="checkout-form">
              <label>Name</label>
              <input placeholder="Your name" />

              <label>Phone</label>
              <input placeholder="Phone number" />

              <label>Email</label>
              <input placeholder="Email address" />

              <label>Service required</label>
              <select>
                <option>Select a service</option>
                <option>Decorative Glass</option>
                <option>Glass Partition</option>
                <option>Custom Glass</option>
                <option>Installation</option>
              </select>

              <label>Requirements</label>
              <textarea placeholder="Tell us what you need"></textarea>

              <button className="primary-btn full">
                Submit Enquiry
              </button>
            </div>
          </div>
        </main>
      )}

      {/* CONTACT */}
      {page === "contact" && (
        <main className="page-container">
          <div className="page-title">
            <p className="eyebrow">GET IN TOUCH</p>
            <h1>Contact Glassmart</h1>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <span>📞</span>
              <h3>Call Us</h3>
              <p>+91 XXXXX XXXXX</p>
            </div>

            <div className="contact-card">
              <span>✉️</span>
              <h3>Email</h3>
              <p>info@glassmart.com</p>
            </div>

            <div className="contact-card">
              <span>📍</span>
              <h3>Visit Us</h3>
              <p>Glassmart Showroom</p>
            </div>
          </div>
        </main>
      )}

      {/* LOGIN */}
      {page === "login" && (
        <main className="page-container login-page">
          <div className="login-box">
            <p className="eyebrow">GLASSMART ACCOUNT</p>

            <h1>{loginMode === "login" ? "Welcome back" : "Create account"}</h1>

            {/* ACCOUNT TYPE */}
            <div className="account-types">
              <p className="field-label">Account type</p>

              <div className="account-type-grid">
                {[
                  "Customer",
                  "Carpenter",
                  "Interior",
                  "Engineer",
                  "Architect",
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={
                      accountType === type
                        ? "account-type active"
                        : "account-type"
                    }
                    onClick={() => setAccountType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* ADMIN */}
              <button
                type="button"
                className={
                  accountType === "Admin"
                    ? "account-type admin-type active"
                    : "account-type admin-type"
                }
                onClick={() => setAccountType("Admin")}
              >
                Admin
              </button>
            </div>

            {/* EMAIL */}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* PASSWORD */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* REGISTER ONLY */}
            {loginMode === "register" && (
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}

            <button
              className="primary-btn full"
              onClick={handleAuth}
            >
              {loginMode === "login" ? "Login" : "Create Account"}
            </button>

            {/* SWITCH LOGIN / REGISTER */}
            <p className="login-switch">
              {loginMode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() =>
                  setLoginMode(
                    loginMode === "login" ? "register" : "login"
                  )
                }
              >
                {loginMode === "login" ? "Register" : "Login"}
              </button>
            </p>

            <p className="login-note">
              {accountType === "Customer"
                ? "Customer accounts can purchase products and earn reward points."
                : accountType === "Admin"
                  ? "Admin accounts can manage products, orders and quotations."
                  : "Professional accounts receive access to professional pricing and benefits."}
            </p>
          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          <span>GLASS</span>MART
        </div>

        <p>Premium glass solutions for modern spaces.</p>

        <p className="copyright">
          © 2026 Glassmart. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;