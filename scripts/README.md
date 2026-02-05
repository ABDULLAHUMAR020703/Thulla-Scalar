# Supabase SQL Scripts

These SQL scripts improve multiplayer reliability for the Thulla game.

## How to Run

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run each script in order (001 → 006)

## Scripts

| Script | Purpose |
|--------|---------|
| `000_clear_all_data.sql` | Clear all game data (dev only) |
| `001_room_status.sql` | Add room status constraint |
| `002_player_cleanup_trigger.sql` | Auto-end empty rooms |
| `003_host_constraint.sql` | Enforce host ownership |
| `004_player_position_index.sql` | Index player positions |
| `005_card_index.sql` | Index cards (Ace of Spades) |
| `006_room_player_view.sql` | Room player count views |
| `007_row_level_security.sql` | RLS policies for all tables |

## Order Matters

Run scripts in numerical order. Some scripts depend on previous ones.

## Verification

Each script includes verification queries at the bottom to test functionality.
