export function getPublicAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, "") ||
    "https://app.withconviction.ai"
  );
}
