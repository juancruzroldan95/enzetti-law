import { getInstagramData } from "../../utils/instagram";

export const GET = async () => {
  const data = await getInstagramData();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
