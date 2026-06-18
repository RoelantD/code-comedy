Build an MCP server for the Code & Comedy event JSON.

The server helps AI agents answer questions about the event schedule, sessions, speakers, categories, timing, and event metadata.

Functional requirements:

1. The server exposes tools that allow an agent to:
   - get_event_info: return event name, theme, date, venue, city, and country.
   - list_schedule: return the full chronological schedule.
   - get_current_or_next_item: given a time, return the active schedule item or the next upcoming item.
   - search_sessions: search sessions by title, abstract, speaker name, category, or session type.
   - list_speakers: return all speakers with their sessions and available bios.
   - list_categories: return all categories and the sessions linked to each category.
   - recommend_sessions: given interests such as "AI agents", "data", "developer productivity", or "robotics", return matching sessions with reasons.
   - get_session_details: return full details for one matching session.

2. The server must understand nested breakout groups and flatten their sessions when needed.

3. Search must be case-insensitive and tolerate partial matches.

4. Results must include enough context for an agent to explain why an item matched.

5. If data is missing, the server must say it is unavailable instead of inventing it.

6. If multiple sessions happen at the same time, the server must preserve that overlap and not pretend the user can attend all of them.

7. The server must support demo-friendly questions such as:
   - What is this event about?
   - What sessions are about AI agents?
   - Who is speaking after dinner?
   - What can I attend at 19:45?
   - Which sessions match developer productivity?
   - Give me a recommendation if I care about MCP and agents.

Success criteria:

- An agent can reliably answer event questions using only the MCP tools.
- Tool responses are concise, structured, and grounded in the JSON.
- Invalid queries return helpful empty results, not crashes.
- Missing abstracts or bios are handled gracefully.