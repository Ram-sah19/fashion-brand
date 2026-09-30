export type CircleMeeting = {
  _id: string;
  circle: string;
  title: string;
  description?: string;
  scheduledAt: string;
  createdBy: string;
  status: "scheduled" | "cancelled" | "completed";
};

async function meetingRequest(
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
        "Circle meeting request failed",
    );
  }

  return data;
}

export async function createCircleMeeting(
  circleId: string,
  data: {
    title: string;
    description?: string;
    scheduledAt: string;
  },
): Promise<CircleMeeting> {
  const result =
    await meetingRequest(
      `/api/circles/${circleId}/meetings`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

  return result.meeting;
}

export async function getCircleMeetings(
  circleId: string,
): Promise<CircleMeeting[]> {
  const result =
    await meetingRequest(
      `/api/circles/${circleId}/meetings`,
    );

  return result.meetings || [];
}

export async function cancelCircleMeeting(
  circleId: string,
  meetingId: string,
) {
  return meetingRequest(
    `/api/circles/${circleId}/meetings/${meetingId}`,
    {
      method: "DELETE",
    },
  );
}