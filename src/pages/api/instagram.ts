export const GET = async () => {
  // Placeholder for real Instagram API logic
  // In a real app, you would fetch from the Instagram Graph API here

  return new Response(
    JSON.stringify({
      followers: "12.5k",
      posts: 342,
      username: "@estudioenzetti"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
