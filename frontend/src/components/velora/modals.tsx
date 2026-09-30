import {
  CheckCircle2,
  Lock,
  LogOut,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { CircleMemberManager } from "@/components/velora/CircleMemberManager";
import { Button } from "@/components/ui/button";
import { createCircleMeeting } from "@/lib/circle-meeting-api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  createCircle,
  deleteCircle,
  editCircle,
  getMyCircles,
  type Circle,
} from "@/lib/circle-api";
import { leaveCircle } from "@/lib/circle-member-api";

export function PrivacyToggle({
  label,
  description,
  defaultChecked = true,
}: {
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="border-border bg-surface-2/40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border px-4 py-3">
      <div className="min-w-0">
        <Label
          htmlFor={id}
          className="text-[13px] font-medium"
        >
          {label}
        </Label>

        {description && (
          <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <Switch
        id={id}
        defaultChecked={defaultChecked}
      />
    </div>
  );
}
type InstantMeetingUser = {
  _id: string;
  name: string;
  email: string;
};

type InstantMeetingCircle = {
  _id: string;
  name: string;
};

export function StartInstantMeetingModal({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [meetingType, setMeetingType] = useState<
    "private" | "circle"
  >("private");

  const [callType, setCallType] =
    useState<"audio" | "video">("video");

  const [search, setSearch] = useState("");

  const [users, setUsers] = useState<
    InstantMeetingUser[]
  >([]);

  const [selectedUsers, setSelectedUsers] =
    useState<InstantMeetingUser[]>([]);

  const [circles, setCircles] = useState<
    InstantMeetingCircle[]
  >([]);

  const [selectedCircle, setSelectedCircle] =
    useState("");

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [loadingCircles, setLoadingCircles] =
    useState(false);

  const [starting, setStarting] =
    useState(false);

  /*
   * Load real users when Private Meeting
   * is selected.
   */
  useEffect(() => {
    if (!open || meetingType !== "private") {
      return;
    }

    const query = search.trim();

    if (!query) {
      setUsers([]);
      return;
    }

    let cancelled = false;

    async function searchUsers() {
      try {
        setLoadingUsers(true);

        const token =
          localStorage.getItem("token");

        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(
            query,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to search users",
          );
        }

        if (!cancelled) {
          const currentUser =
            JSON.parse(
              localStorage.getItem(
                "user",
              ) || "{}",
            );

          const currentUserId =
            currentUser.id ||
            currentUser._id;

          setUsers(
            (data.users || []).filter(
              (user: InstantMeetingUser) =>
                user._id !== currentUserId &&
                user._id !== currentUserId,
            ),
          );
        }
      } catch (error) {
        console.error(
          "Search users error:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    }

    const timer = window.setTimeout(
      () => {
        void searchUsers();
      },
      300,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, meetingType, search]);

  /*
   * Load the user's real circles.
   */
  useEffect(() => {
    if (!open || meetingType !== "circle") {
      return;
    }

    let cancelled = false;

    async function loadCircles() {
      try {
        setLoadingCircles(true);

        const result =
          await getMyCircles();

        if (!cancelled) {
          setCircles(result);

          if (result[0]) {
            setSelectedCircle(
              result[0]._id,
            );
          }
        }
      } catch (error) {
        console.error(
          "Load circles error:",
          error,
        );

        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load circles",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCircles(false);
        }
      }
    }

    void loadCircles();

    return () => {
      cancelled = true;
    };
  }, [open, meetingType]);

  function toggleUser(
    user: InstantMeetingUser,
  ) {
    setSelectedUsers((previous) => {
      const exists = previous.some(
        (item) => item._id === user._id,
      );

      if (exists) {
        return previous.filter(
          (item) => item._id !== user._id,
        );
      }

      return [...previous, user];
    });
  }

  async function handleStartMeeting() {
    try {
      setStarting(true);

      if (
        meetingType === "private" &&
        selectedUsers.length === 0
      ) {
        toast.error(
          "Please select at least one user",
        );
        return;
      }

      if (
        meetingType === "circle" &&
        !selectedCircle
      ) {
        toast.error(
          "Please select a Circle",
        );
        return;
      }

      /*
       * Store the selected participants temporarily.
       *
       * The meeting page will use the existing
       * useCall() hook.
       */
      sessionStorage.setItem(
        "instantMeetingType",
        meetingType,
      );

      sessionStorage.setItem(
        "instantMeetingCallType",
        callType,
      );

      sessionStorage.setItem(
        "instantMeetingUsers",
        JSON.stringify(
          selectedUsers.map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
          })),
        ),
      );

      if (meetingType === "circle") {
        sessionStorage.setItem(
          "instantMeetingCircleId",
          selectedCircle,
        );
      } else {
        sessionStorage.removeItem(
          "instantMeetingCircleId",
        );
      }

      setOpen(false);

      navigate({
        to: "/meeting/$meetingId",
        params: {
          meetingId: `instant-${Date.now()}`,
        },
      });
    } catch (error) {
      console.error(
        "Start instant meeting error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start meeting",
      );
    } finally {
      setStarting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (!value) {
          setSearch("");
          setUsers([]);
          setSelectedUsers([]);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="glass max-h-[90dvh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video
              className="text-primary h-4 w-4"
              aria-hidden
            />
            Start Instant Meeting
          </DialogTitle>

          <DialogDescription>
            Choose who should be invited to the
            meeting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Meeting type */}
          <div className="space-y-2">
            <Label>Meeting type</Label>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={
                  meetingType === "private"
                    ? "default"
                    : "outline"
                }
                className="h-auto justify-start py-4"
                onClick={() =>
                  setMeetingType("private")
                }
              >
                <UserRound className="mr-2 h-4 w-4" />

                <span className="text-left">
                  <span className="block">
                    Private Meeting
                  </span>

                  <span className="text-muted-foreground block text-[11px]">
                    Select specific users
                  </span>
                </span>
              </Button>

              <Button
                type="button"
                variant={
                  meetingType === "circle"
                    ? "default"
                    : "outline"
                }
                className="h-auto justify-start py-4"
                onClick={() =>
                  setMeetingType("circle")
                }
              >
                <Users className="mr-2 h-4 w-4" />

                <span className="text-left">
                  <span className="block">
                    Circle Meeting
                  </span>

                  <span className="text-muted-foreground block text-[11px]">
                    Use a Circle
                  </span>
                </span>
              </Button>
            </div>
          </div>

          {/* Call type */}
          <div className="space-y-2">
            <Label>Call type</Label>

            <Select
              value={callType}
              onValueChange={(value) =>
                setCallType(
                  value as "audio" | "video",
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="video">
                  Video meeting
                </SelectItem>

                <SelectItem value="audio">
                  Audio meeting
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PRIVATE */}
          {meetingType === "private" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>
                  Select participants
                </Label>

                <div className="relative">
                  <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />

                  <Input
                    className="pl-9"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              {loadingUsers && (
                <p className="text-muted-foreground text-xs">
                  Searching users...
                </p>
              )}

              {!loadingUsers &&
                search.trim() &&
                users.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    No users found.
                  </p>
                )}

              <div className="max-h-52 space-y-2 overflow-y-auto">
                {users.map((user) => {
                  const selected =
                    selectedUsers.some(
                      (item) =>
                        item._id === user._id,
                    );

                  return (
                    <button
                      key={user._id}
                      type="button"
                      className={`border-border flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${selected
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-surface-2"
                        }`}
                      onClick={() =>
                        toggleUser(user)
                      }
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="bg-primary/10 text-primary grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold">
                          {user.name
                            .split(/\s+/)
                            .map(
                              (part) =>
                                part[0],
                            )
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {user.name}
                          </p>

                          <p className="text-muted-foreground truncate text-xs">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {selected && (
                        <CheckCircle2 className="text-primary h-5 w-5 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedUsers.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {selectedUsers.length} participant
                  {selectedUsers.length !== 1
                    ? "s"
                    : ""}{" "}
                  selected
                </p>
              )}
            </div>
          )}

          {/* CIRCLE */}
          {meetingType === "circle" && (
            <div className="space-y-2">
              <Label>
                Select Circle
              </Label>

              <Select
                value={selectedCircle}
                onValueChange={
                  setSelectedCircle
                }
                disabled={
                  loadingCircles ||
                  circles.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingCircles
                        ? "Loading Circles..."
                        : "Select a Circle"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {circles.map((circle) => (
                    <SelectItem
                      key={circle._id}
                      value={circle._id}
                    >
                      {circle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!loadingCircles &&
                circles.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    You are not a member of any
                    Circle.
                  </p>
                )}

              <p className="text-muted-foreground text-xs">
                Circle membership is handled
                privately. Other members are not
                displayed here.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={starting}
          >
            Cancel
          </Button>

          <Button
            onClick={() => {
              void handleStartMeeting();
            }}
            disabled={
              starting ||
              (meetingType === "private" &&
                selectedUsers.length === 0) ||
              (meetingType === "circle" &&
                !selectedCircle)
            }
          >
            {starting
              ? "Starting..."
              : "Start Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export function CreateCircleModal({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const [open, setOpen] =
    useState(false);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  async function handleCreateCircle() {
    if (!name.trim()) {
      toast.error(
        "Circle name is required",
      );
      return;
    }

    try {
      setSaving(true);

      await createCircle({
        name: name.trim(),
        description:
          description.trim(),
      });

      toast.success(
        "Circle created successfully",
        {
          description:
            "Your private Circle has been created.",
        },
      );

      setName("");
      setDescription("");
      setOpen(false);
    } catch (error) {
      console.error(
        "Create Circle error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Circle",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="glass max-h-[90dvh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock
              className="text-primary h-4 w-4"
              aria-hidden
            />
            Create a Private Circle
          </DialogTitle>

          <DialogDescription>
            Circles are private by default. Visibility settings can be tightened at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="circle-name">
              Circle name
            </Label>

            <Input
              id="circle-name"
              placeholder="e.g. Project Nova"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="circle-description">
              Description
            </Label>

            <Textarea
              id="circle-description"
              rows={3}
              placeholder="What is this Circle for?"
              className="resize-none"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="circle-privacy">
              Privacy level
            </Label>

            <Select defaultValue="private">
              <SelectTrigger
                id="circle-privacy"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="private">
                  Private
                </SelectItem>

                <SelectItem value="restricted">
                  Restricted
                </SelectItem>

                <SelectItem value="invite">
                  Invite only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-muted-foreground text-[11px] tracking-widest uppercase">
              Visibility controls
            </p>

            <PrivacyToggle
              label="Hide member count"
            />

            <PrivacyToggle
              label="Hide member directory"
            />

            <PrivacyToggle
              label="Hide online status"
            />

            <PrivacyToggle
              label="Disable join and leave notifications"
            />

            <PrivacyToggle
              label="Restrict invitations"
              defaultChecked={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() =>
              setOpen(false)
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreateCircle}
            disabled={
              saving ||
              !name.trim()
            }
          >
            {saving
              ? "Creating..."
              : "Create Circle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduleMeetingModal({
  trigger,
  circleId,
}: {
  trigger: ReactNode;
  circleId: string;
}) {
  const [open, setOpen] =
    useState(false);

  const [done, setDone] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [date, setDate] =
    useState("");

  const [time, setTime] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /*
   * =====================================================
   * REAL CIRCLE LIST FOR MEETING SELECTION
   * =====================================================
   */

  const [availableCircles, setAvailableCircles] =
    useState<Circle[]>([]);

  const [selectedCircleId, setSelectedCircleId] =
    useState(circleId);

  const [loadingCircles, setLoadingCircles] =
    useState(false);

  /*
   * Keep the selected Circle synchronized
   * with the Circle from the page.
   */
  useEffect(() => {
    setSelectedCircleId(circleId);
  }, [circleId]);

  /*
   * Load the user's real Circles whenever
   * the Schedule Meeting modal is opened.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadCircles() {
      try {
        setLoadingCircles(true);

        const result =
          await getMyCircles();

        if (cancelled) {
          return;
        }

        setAvailableCircles(result);

        /*
         * If the current Circle exists in the
         * user's real Circle list, select it.
         */
        const currentCircleExists =
          result.some(
            (circle) =>
              circle._id === circleId,
          );

        if (currentCircleExists) {
          setSelectedCircleId(circleId);
        } else {
          const firstCircle = result[0];

          if (firstCircle) {
            setSelectedCircleId(
              firstCircle._id,
            );
          }
        }
      } catch (error) {
        console.error(
          "Load Circles error:",
          error,
        );

        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load Circles",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCircles(false);
        }
      }
    }

    void loadCircles();

    return () => {
      cancelled = true;
    };
  }, [open, circleId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (!value) {
          setTimeout(
            () => setDone(false),
            200,
          );
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="glass max-h-[90dvh] overflow-y-auto sm:max-w-[540px]">
        {done ? (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="bg-success/15 text-success grid h-14 w-14 place-items-center rounded-2xl">
              <CheckCircle2
                className="h-7 w-7"
                aria-hidden
              />
            </span>

            <DialogTitle className="mt-5 text-base">
              Meeting scheduled
            </DialogTitle>

            <DialogDescription className="mt-1.5 max-w-xs text-xs">
              Invitations were sent privately. Participants are not disclosed to attendees.
            </DialogDescription>

            <Button
              className="mt-6"
              onClick={() =>
                setOpen(false)
              }
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck
                  className="text-primary h-4 w-4"
                  aria-hidden
                />
                Schedule a meeting
              </DialogTitle>

              <DialogDescription>
                Meetings inherit the privacy posture of the selected Circle.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">
                  Meeting title
                </Label>

                <Input
                  id="meeting-title"
                  placeholder="Product Strategy"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="meeting-date">
                    Date
                  </Label>

                  <Input
                    id="meeting-date"
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-time">
                    Time
                  </Label>

                  <Input
                    id="meeting-time"
                    type="time"
                    value={time}
                    onChange={(event) =>
                      setTime(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-duration">
                    Duration
                  </Label>

                  <Select defaultValue="45">
                    <SelectTrigger
                      id="meeting-duration"
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="15">
                        15 min
                      </SelectItem>

                      <SelectItem value="30">
                        30 min
                      </SelectItem>

                      <SelectItem value="45">
                        45 min
                      </SelectItem>

                      <SelectItem value="60">
                        1 hour
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* =====================================================
                  CIRCLE / PARTICIPANTS
                  ===================================================== */}

              <div className="space-y-2">
                <Label htmlFor="meeting-circle">
                  Circle / participants
                </Label>

                <Select
                  value={selectedCircleId}
                  onValueChange={
                    setSelectedCircleId
                  }
                  disabled={
                    loadingCircles ||
                    availableCircles.length === 0
                  }
                >
                  <SelectTrigger
                    id="meeting-circle"
                    className="w-full"
                  >
                    <SelectValue
                      placeholder={
                        loadingCircles
                          ? "Loading Circles..."
                          : "Select a Circle"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {availableCircles.map(
                      (circle) => (
                        <SelectItem
                          key={circle._id}
                          value={circle._id}
                        >
                          {circle.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                {!loadingCircles &&
                  availableCircles.length ===
                  0 && (
                    <p className="text-muted-foreground text-xs">
                      No Circles available.
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-description">
                  Description
                </Label>

                <Textarea
                  id="meeting-description"
                  rows={3}
                  className="resize-none"
                  placeholder="Agenda and context"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-[11px] tracking-widest uppercase">
                  Privacy
                </p>

                <PrivacyToggle
                  label="Private meeting"
                  description="Participant list is hidden from attendees."
                />

                <PrivacyToggle
                  label="Invite only"
                  description="Link joining is disabled."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() =>
                  setOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                disabled={
                  saving ||
                  !selectedCircleId
                }
                onClick={async () => {
                  if (!title.trim()) {
                    toast.error(
                      "Meeting title is required",
                    );
                    return;
                  }

                  if (!date || !time) {
                    toast.error(
                      "Meeting date and time are required",
                    );
                    return;
                  }

                  if (!selectedCircleId) {
                    toast.error(
                      "Please select a Circle",
                    );
                    return;
                  }

                  const scheduledAt =
                    new Date(
                      `${date}T${time}`,
                    );

                  if (
                    Number.isNaN(
                      scheduledAt.getTime(),
                    )
                  ) {
                    toast.error(
                      "Invalid meeting date or time",
                    );
                    return;
                  }

                  if (
                    scheduledAt.getTime() <=
                    Date.now()
                  ) {
                    toast.error(
                      "Meeting must be scheduled for a future time",
                    );
                    return;
                  }

                  try {
                    setSaving(true);

                    await createCircleMeeting(
                      selectedCircleId,
                      {
                        title:
                          title.trim(),

                        description:
                          description.trim(),

                        scheduledAt:
                          scheduledAt.toISOString(),
                      },
                    );

                    toast.success(
                      "Meeting scheduled successfully",
                    );

                    setDone(true);

                    setTitle("");
                    setDate("");
                    setTime("");
                    setDescription("");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to schedule meeting",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving
                  ? "Scheduling..."
                  : "Schedule Meeting"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ManageCircleModal({
  trigger,
  circleId,
  circleName,
  circleDescription = "",
}: {
  trigger: ReactNode;
  circleId: string;
  circleName: string;
  circleDescription?: string;
}) {
  const [name, setName] =
    useState(circleName);

  const [description, setDescription] =
    useState(circleDescription);

  const [saving, setSaving] =
    useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="glass max-h-[90dvh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users
              className="text-primary h-4 w-4"
              aria-hidden
            />
            Manage Circle
          </DialogTitle>

          <DialogDescription>
            Manage settings for{" "}
            <strong>{circleName}</strong>.
            Member data shown here is never exposed
            in normal member views.
          </DialogDescription>
        </DialogHeader>

        {/* Edit Circle */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manage-circle-name">
              Circle name
            </Label>

            <Input
              id="manage-circle-name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manage-circle-description">
              Description
            </Label>

            <Textarea
              id="manage-circle-description"
              rows={3}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              className="resize-none"
            />
          </div>
        </div>

        {/* Privacy settings */}
        <div className="space-y-2">
          <PrivacyToggle
            label="Hide member count"
          />

          <PrivacyToggle
            label="Hide member directory"
          />

          <PrivacyToggle
            label="Hide online status"
          />

          <PrivacyToggle
            label="Restrict invitations"
            defaultChecked={false}
          />
        </div>

        {/* Member management */}
        <div className="border-border border-t pt-4">
          <CircleMemberManager
            circleId={circleId}
          />
        </div>

        {/* Leave Circle */}
        <div className="border-border border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:text-destructive w-full"
            onClick={async () => {
              const confirmed =
                window.confirm(
                  "Are you sure you want to leave this Circle?",
                );

              if (!confirmed) {
                return;
              }

              try {
                await leaveCircle(
                  circleId,
                );

                toast.success(
                  "You have left the Circle.",
                );

                window.location.href =
                  "/circles";
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to leave Circle",
                );
              }
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Leave Circle
          </Button>
        </div>

        {/* Delete Circle */}
        <div className="border-border border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:text-destructive w-full"
            onClick={async () => {
              const confirmed =
                window.confirm(
                  "Are you sure you want to permanently delete this Circle? This action cannot be undone.",
                );

              if (!confirmed) {
                return;
              }

              try {
                await deleteCircle(
                  circleId,
                );

                toast.success(
                  "Circle deleted successfully.",
                );

                window.location.href =
                  "/circles";
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to delete Circle",
                );
              }
            }}
          >
            Delete Circle
          </Button>
        </div>

        <DialogFooter>
          <Button
            asChild
            variant="outline"
          >
            <a
              href={`/circles/${circleId}/members`}
            >
              Manage members
            </a>
          </Button>

          <Button
            disabled={saving}
            onClick={async () => {
              if (!name.trim()) {
                toast.error(
                  "Circle name is required",
                );
                return;
              }

              try {
                setSaving(true);

                await editCircle(
                  circleId,
                  {
                    name: name.trim(),
                    description:
                      description.trim(),
                  },
                );

                toast.success(
                  "Circle updated successfully",
                );
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to update Circle",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving
              ? "Saving..."
              : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}