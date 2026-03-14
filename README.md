# watering-api

Modular TypeScript API starter focused on clean route composition and easy scalability.

## Stack

- Node.js + Express
- TypeScript

## Project Structure

```text
src/
	app.ts
	server.ts
	config/
		env.ts
	middlewares/
		error-handler.ts
		not-found.ts
	routes/
		index.ts
		health.route.ts
	types/
		route-module.ts
```

## Getting Started

1. Install dependencies:

	 ```bash
	 npm install
	 ```

2. Start in development mode:

	 ```bash
	 npm run dev
	 ```

3. Build for production:

	 ```bash
	 npm run build
	 ```

4. Run production build:

	 ```bash
	 npm run start
	 ```

## Routes

- `GET /api/health`

Example response:

```json
{
	"status": "ok",
	"service": "watering-api",
	"timestamp": "2026-03-14T12:00:00.000Z"
}
```

## Adding a New Route (Clean Modular Pattern)

1. Create a route module in `src/routes`, for example `users.route.ts`.
2. Export an object matching `RouteModule` (`path` + `router`).
3. Register it in `src/routes/index.ts` by adding it to `routeModules`.

This keeps each route isolated and makes API growth straightforward.