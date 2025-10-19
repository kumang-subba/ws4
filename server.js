const path = require("path");
const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true })); // read HTML form fields into req.body
app.use(express.json()); // read JSON bodies
app.use(express.static(path.join(__dirname, "public"))); // serve files from /public

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Simple router examples
const router = require("express").Router();

router.get("/time", (req, res) => res.json({ now: new Date().toISOString() }));

router.get("/hello/:name", (req, res) => {
  res.send("Hello " + req.params.name);
});

router.get("/search", async (req, res) => {
  const q = (req.query.q || "phone").trim();
  const src = (req.query.src || "demo").toLowerCase();
  try {
    if (src === "github") {
      const { data } = await axios.get("https://api.github.com/search/repositories", {
        params: { q },
        headers: { Accept: "application/vnd.github+json" },
        timeout: 6000,
      });
      const items = (data.items || []).slice(0, 5).map((r) => ({
        name: r.full_name,
        stars: r.stargazers_count,
        url: r.html_url,
        description: r.description || "",
      }));
      return res.json({ source: "github", total: data.total_count, top5: items });
    }

    // Default to DemoJSON demo API, friendlier in class
    const { data } = await axios.get("https://dummyjson.com/products/search", {
      params: { q, limit: 5 },
      timeout: 6000,
    });
    const items = (data.products || []).map((p) => ({
      title: p.title,
      price: p.price,
      brand: p.brand,
      rating: p.rating,
      thumbnail: p.thumbnail,
    }));
    return res.json({ source: "demo", total: data.total, top5: items });
  } catch (e) {
    const status = e.response?.status || 502;
    const msg = e.response?.data?.message || e.message || "Upstream error";
    return res.status(status).json({ error: msg, tip: "Try the Demo source if GitHub is rate limited." });
  }
});

app.use("/api", router); // Now /api/time and /api/hello/yourname work

// Read the form value then redirect so the front end calls our API
app.post("/search", (req, res) => {
  const term = (req.body.q || "").trim();
  const src = (req.body.src || "demo").toLowerCase(); // "demo" or "github"
  console.log("Search:", { term, src });
  res.redirect("/#q=" + encodeURIComponent(term) + "&src=" + encodeURIComponent(src));
});

app.listen(PORT, () => console.log("Server on http://localhost:" + PORT));
