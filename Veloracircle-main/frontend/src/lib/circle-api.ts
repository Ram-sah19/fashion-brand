export type Circle = {
  _id: string;
  name: string;
  description?: string;
  members?: string[];
  admins?: string[];

  // Used only for the existing Circle card UI.
  privacy?: string;
  activity?: string;
};

export async function getMyCircles(): Promise<
  Circle[]
> {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    "/api/circles",
    {
      headers: {
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
        "Failed to load Circles",
    );
  }

  return data.circles || [];
}

export async function getCircle(
  circleId: string,
): Promise<Circle> {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `/api/circles/${circleId}`,
    {
      headers: {
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
        "Failed to load Circle",
    );
  }

  return data.circle;
}

export async function editCircle(
  circleId: string,
  data: {
    name: string;
    description?: string;
  },
): Promise<Circle> {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `/api/circles/${circleId}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(data),
    },
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to update Circle",
    );
  }

  return result.circle;
}

export async function deleteCircle(
  circleId: string,
): Promise<void> {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `/api/circles/${circleId}`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    },
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to delete Circle",
    );
  }
}
export async function createCircle(
  data: {
    name: string;
    description?: string;
  },
): Promise<Circle> {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    "/api/circles",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(data),
    },
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to create Circle",
    );
  }

  return result.circle;
}
export type AdminCircleMember = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "superadmin";
};

export type AdminCircle = {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: AdminCircleMember[];
  admins: string[];
};

export async function getAllCirclesForAdmin(): Promise<
  AdminCircle[]
> {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    "/api/circles/admin/all",
    {
      method: "GET",
      headers: {
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
        "Failed to load Circles",
    );
  }

  if (
    !data.circles ||
    !Array.isArray(data.circles)
  ) {
    throw new Error(
      "Invalid Circles response from server",
    );
  }

  return data.circles;
}