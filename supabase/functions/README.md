# Supabase Edge Functions

This folder contains Supabase Edge Functions for the Thulla game.

## Functions

| Function | Purpose |
|----------|---------|
| `start-game` | Validate and start a game |

## Deployment

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy start-game
```

## Testing

```bash
# Test locally
supabase functions serve

# Call function
curl -X POST http://localhost:54321/functions/v1/start-game \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id": "your-room-uuid"}'
```

## Error Codes

| Code | Meaning |
|------|---------|
| `AUTH_REQUIRED` | Missing or invalid auth token |
| `MISSING_ROOM_ID` | room_id not provided |
| `ROOM_NOT_FOUND` | Room doesn't exist |
| `NOT_HOST` | Caller is not the host |
| `GAME_STARTED` | Game already started |
| `NOT_ENOUGH_PLAYERS` | Room not full |
| `DEAL_ERROR` | Card dealing failed |
| `ACE_NOT_FOUND` | Deck error |
