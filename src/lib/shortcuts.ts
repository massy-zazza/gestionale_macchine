export function validateShortcutAuth(request: Request) {
  return request.headers.get("authorization") === `Bearer ${process.env.SHORTCUTS_API_KEY}`;
}
