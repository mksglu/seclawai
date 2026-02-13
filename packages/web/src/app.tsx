import { Hono } from "hono";
import { renderer } from "./components/layout.js";
import { Home } from "./pages/home.js";
import { Templates } from "./pages/templates.js";
import { Docs } from "./pages/docs.js";
import { Success } from "./pages/success.js";

type Bindings = {
  API_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Layout renderer
app.use(renderer);

// Pages
app.get("/", (c) => c.render(<Home />));
app.get("/templates", (c) => c.render(<Templates />));
app.get("/docs", (c) => c.render(<Docs />));
app.get("/success", (c) => c.render(<Success />));

// 404
app.notFound((c) =>
  c.render(
    <div class="flex min-h-screen items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white">404</h1>
        <p class="mt-2 text-neutral-400">Page not found</p>
        <a href="/" class="mt-4 inline-block text-green-400 underline">
          Go home
        </a>
      </div>
    </div>
  )
);

export default app;
