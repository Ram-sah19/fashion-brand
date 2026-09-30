export type CircleMember = {
  _id: string;
  name: string;
  email: string;
};

async function circleRequest(
  url: string,
  options: RequestInit = {},
) {
  const token =
    localStorage.getItem("token");

  const response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Circle request failed",
    );
  }

  return data;
}

export async function getCircleMembers(
  circleId: string,
): Promise<CircleMember[]> {
  const data =
    await circleRequest(
      `/api/circles/${circleId}`,
    );

  return data.circle.members || [];
}

export async function addCircleMember(
  circleId: string,
  userId: string,
) {
  return circleRequest(
    `/api/circles/${circleId}/members`,
    {
      method: "POST",
      body: JSON.stringify({
        userId,
      }),
    },
  );
}

export async function removeCircleMember(
  circleId: string,
  userId: string,
) {
  return circleRequest(
    `/api/circles/${circleId}/members`,
    {
      method: "DELETE",
      body: JSON.stringify({
        userId,
      }),
    },
  );
}

export async function promoteCircleAdmin(
  circleId: string,
  userId: string,
) {
  return circleRequest(
    `/api/circles/${circleId}/admins/promote`,
    {
      method: "POST",
      body: JSON.stringify({
        userId,
      }),
    },
  );
}

export async function demoteCircleAdmin(
  circleId: string,
  userId: string,
) {
  return circleRequest(
    `/api/circles/${circleId}/admins/demote`,
    {
      method: "POST",
      body: JSON.stringify({
        userId,
      }),
    },
  );
}

export async function leaveCircle(
  circleId: string,
) {
  return circleRequest(
    `/api/circles/${circleId}/leave`,
    {
      method: "POST",
    },
  );
}