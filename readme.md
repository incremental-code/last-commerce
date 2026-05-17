# last-commerce

A tiny e-commerce demo on the last-act / last-router / last-server / last-ui stack.

## Run

```
npm install
npm start
```

Then open http://localhost:3000.

## What's in it

- `src/page.tsx` — product grid (home)
- `src/products/[id]/page.tsx` — product detail
- `src/cart/page.tsx` — cart with reactive line totals
- `src/lib/cart-store.ts` — module-level `Signal.State<CartLine[]>` plus add/remove/setQuantity helpers
- `src/lib/Nav.tsx` — shared nav with a live cart-count badge

The cart lives in a single module-level Signal. Components subscribe by passing `Signal.Computed` values where reactivity is needed (cart badge, cart contents, total).

## Notes

- Cart resets on a hard reload — there is no persistence layer.
- The server-side cart is always empty per request, so SSR for `/cart` shows empty state; the client takes over after hydration.
