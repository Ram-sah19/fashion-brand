export type CircleConversation = {
  id: string;
  type: "circle";
  circleId: string;
};

export async function getOrCreateCircleConversation(
  circleId: string,
): Promise<CircleConversation> {
  const token =
    localStorage.getItem("token");

  const response =
    await fetch(
      `/api/circle-conversations/${circleId}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },
      },
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to open Circle conversation",
    );
  }

  return data.conversation;
}