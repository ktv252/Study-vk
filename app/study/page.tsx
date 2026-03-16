"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import BatchCard from "@/app/components/BatchCard";
import PromotionPopup from "@/app/components/PromotionPopup";

interface Button {
  Name: string;
  Link: string;
}

interface Promotion {
  title: string;
  message?: string;
  imageUrl?: string;
  button?: Button;
}

import {
  getEnrolledBatches,
  getTodaysSchedule,
  getUserDetailsList,
} from "@/utils/api";
import { toast } from "sonner";
import LiveClassCard from "@/app/components/LiveClassCard";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";

type EnrolledBatch = { _id: string; batchId: string; name: string };

export default function Home() {
  const router = useRouter();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableClasses, setAvailableClasses] = useState<EnrolledBatch[]>([]);
  const [schedule, setSchedule] = useState([]);
  const [teacherMap, setTeacherMap] = useState<
    Record<string, { name: string; imageUrl: string }>
  >({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const TgChannel = serverInfo?.tg_channel || process.env.NEXT_PUBLIC_TG;

  const promotion = {
    title: "Telegram Community !!",
    message: `Join The Channel For Latest Updates 👍 Don't miss any Future updates!`,
    imageUrl: "https://adsempire.com/blog/wp-content/uploads/adsempire/1132x670_AE_telegram_hid.png",
    button: { Name: "Join Now!", Link: TgChannel },
  };

  useEffect(() => {
    async function fetchServerInfo() {
      try {
        const res = await fetch("/api/auth/serverInfo");
        if (!res.ok) throw new Error("Failed to fetch server info");
        const data = await res.json();
        setServerInfo(data);
      } catch (err) {
        setError("Could not load server info");
      } finally {
        setLoading(false);
      }
    }
    fetchServerInfo();
  }, []);

  const OpenTelegramChannel = () => {
    if (TgChannel) window.open(TgChannel, "_blank");
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1; // scroll speed factor
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const [selectedClass, setSelectedClass] = useState<EnrolledBatch>({
    _id: "",
    batchId: "",
    name: "Select Batch",
  });

  const fetchTodaysSchedule = async (batchId: string) => {
    try {
      // Step 1: Fetch today's schedule for batch
      const scheduleRes = await getTodaysSchedule(batchId);
      const scheduleData = scheduleRes.data || [];

      // ✅ Filter live classes, videos, and standalone documents (Combine them)
      const combinedSchedule = scheduleData.filter((item: any) => {
        const isVideo = item.isVideoLecture === true ||
          item.isLive === true ||
          ["awsVideo", "vimeo", "penpencilvdo", "youtube"].includes(item.urlType) ||
          item.tag?.toUpperCase() === "LIVE";

        const hasAttachment = (item.attachments && item.attachments.length > 0) ||
          (item.homeworkIds && item.homeworkIds[0]?.attachmentIds?.length > 0) ||
          ["pdf", "attachment"].includes(item.urlType);

        return isVideo || hasAttachment;
      });

      // Step 2: Extract all unique teacher IDs
      const teacherIdSet = new Set<string>();
      combinedSchedule.forEach((item: any) => {
        if (Array.isArray(item.teachers) && item.teachers.length > 0) {
          item.teachers.forEach((id: string) => teacherIdSet.add(id));
        }
      });
      const uniqueTeacherIds = Array.from(teacherIdSet);

      // Step 3: Fetch teacher details if any
      let teacherList: any[] = [];
      if (uniqueTeacherIds.length > 0) {
        const teacherRes = await getUserDetailsList(uniqueTeacherIds);
        teacherList = teacherRes.data || [];
      }

      // Step 4: Create teacherId -> { name, imageUrl } map
      const teacherMapTemp: Record<string, { name: string; imageUrl: string }> = {};

      teacherList.forEach((teacher: any) => {
        teacherMapTemp[teacher._id] = {
          name: teacher.name,
          imageUrl: teacher.imageId
            ? `${teacher.imageId.baseUrl}${teacher.imageId.key}`
            : "/assets/img/teacher-placeholder.png",
        };
      });

      // Step 5: Handle fallback for items with no teachers (like PDFs or missing video images)
      combinedSchedule.forEach((item: any) => {
        const hasTeachers = Array.isArray(item.teachers) && item.teachers.length > 0;
        if (!hasTeachers) {
          const fallbackId = item._id;
          teacherMapTemp[fallbackId] = {
            name: "",
            imageUrl: item.videoDetails?.image || "/assets/img/document-placeholder.png",
          };
        }
      });

      // Step 6: Update state
      setSchedule(combinedSchedule);
      setTeacherMap(teacherMapTemp);
      setErrorMsg("");
    } catch (err: any) {
      let message = "Failed to fetch today's schedule.";
      if (err?.message?.includes("401") || err?.message?.toLowerCase().includes("unauthorized")) {
        message = "You are not authorized. Please log in again.";
      } else if (err?.message) {
        message = err.message;
      }
      setErrorMsg(message);
      setSchedule([]);
      setTeacherMap({});
    }
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await getEnrolledBatches();
        const fetchedBatches = data.enrolledBatches || [];

        setAvailableClasses(fetchedBatches);
        localStorage.setItem("enrolledBatches", JSON.stringify(fetchedBatches));
        localStorage.setItem("USER_DATA", JSON.stringify(data.user));

        const savedSelectionRaw = localStorage.getItem("selectedBatch");
        let finalSelectedBatch = fetchedBatches[0] || {
          _id: "",
          batchId: "",
          name: "Select Batch",
        };

        if (savedSelectionRaw && savedSelectionRaw !== "undefined") {
          try {
            const savedSelection = JSON.parse(savedSelectionRaw);
            const found = fetchedBatches.find(
              (batch: EnrolledBatch) => batch._id === savedSelection._id
            );
            if (found) finalSelectedBatch = found;
          } catch (e) {
            finalSelectedBatch = fetchedBatches[0];
          }
        }

        setSelectedClass(finalSelectedBatch);
        localStorage.setItem("selectedBatch", JSON.stringify(finalSelectedBatch));

        if (finalSelectedBatch.batchId) {
          fetchTodaysSchedule(finalSelectedBatch.batchId);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          toast.error("Unauthorized: Please login again.");
        } else {
          toast.error("Failed to load enrolled batches");
        }
        setAvailableClasses([]);
        setSelectedClass({ _id: "", batchId: "", name: "Select Batch" });
      }
    };

    fetchBatches();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1400px]">
      {/* Search/Batch Selection */}
      <div className="bg-background border rounded-lg p-4 sm:p-6 mb-6 divshadow">
        <div className="flex flex-wrap sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 outline-none">
          <div className="flex items-center gap-2 w-full sm:w-auto border rounded-md">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full sm:w-auto justify-between text-left outline-none">
                  <span className="truncate">{selectedClass.name}</span>
                  <ChevronDown className="w-5 h-5 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-full">
                {availableClasses.map((cls) => (
                  <DropdownMenuItem
                    className="border-b p-2 m-1 outline-none"
                    key={cls?._id}
                    onClick={() => {
                      setSelectedClass(cls);
                      localStorage.setItem("selectedBatch", JSON.stringify(cls));
                      fetchTodaysSchedule(cls.batchId);
                    }}
                  >
                    {cls.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Combined Classes & PDFs Section */}
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Today's Class</h3>
          <div className="rounded-lg p-3">
            {errorMsg && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">{errorMsg}</div>}
            <div
              ref={scrollRef}
              className={`flex gap-4 overflow-x-auto whitespace-nowrap ${schedule.length > 0 ? "cursor-grab select-none" : ""
                }`}
              style={{ scrollBehavior: "smooth" }}
              onMouseDown={schedule.length > 0 ? onMouseDown : undefined}
              onMouseUp={schedule.length > 0 ? onMouseUp : undefined}
              onMouseLeave={schedule.length > 0 ? onMouseLeave : undefined}
              onMouseMove={schedule.length > 0 ? onMouseMove : undefined}
            >
              {schedule.length === 0 ? (
                <div className="bg-[#7e7e7e29] rounded-lg p-6 sm:p-8 text-center text-foreground w-full">
                  Classes not Scheduled yet
                </div>
              ) : (
                schedule.map((cls: any, idx: number) => {
                  const teacherId = cls.teachers?.[0];
                  const teacher = teacherMap[teacherId] || teacherMap[cls._id];
                  const teacherName = teacher?.name || "";
                  const teacherImage = teacher?.imageUrl;

                  const startTime = cls.startTime ? new Date(cls.startTime) : null;
                  const endTime = cls.endTime ? new Date(cls.endTime) : null;
                  const now = new Date();

                  const isBefore = startTime ? now < startTime : false;
                  const isDuring = (startTime && endTime) ? (now >= startTime && now <= endTime) : false;
                  const isAfter = endTime ? now > endTime : false;

                  const hoursLeft = startTime ? Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60 * 60)) : 0;
                  const minutesLeft = startTime ? Math.floor(((startTime.getTime() - now.getTime()) / (1000 * 60)) % 60) : 0;
                  const handleClick = () => {
                    const { batchId, subjectId, _id: childId, urlType, isVideoLecture } = cls;
                    const subjectIdStr = typeof subjectId === "string" ? subjectId : subjectId?._id;
                    
                    // Comprehensive attachment extraction
                    const attachment = cls.attachments?.[0] || 
                                       cls.homeworkIds?.[0]?.attachmentIds?.[0] || 
                                       cls.attachmentData || 
                                       (cls.urlType === "pdf" ? { baseUrl: "", key: cls.url } : null);

                    const isVideo = ["awsVideo", "vimeo", "penpencilvdo", "youtube"].includes(urlType) || isVideoLecture === true;
                    
                    // Determine if the video is currently "Ready to Play"
                    const isVideoReady = (urlType === "penpencilvdo") || 
                                         (urlType === "awsVideo" && (isDuring || isAfter)) ||
                                         (urlType === "vimeo" && (isDuring || isAfter)) ||
                                         (urlType === "youtube" && (isDuring || isAfter));

                    // 1. If we have an attachment, open it if:
                    // - It's not a video class
                    // - OR it is a video class but the video is not ready yet (e.g. upcoming)
                    // - OR it's explicitly tagged as a PDF/Attachment
                    if (attachment && (attachment.baseUrl || attachment.key || attachment.url)) {
                        const isExplicitDoc = ["pdf", "attachment"].includes(urlType) || isVideoLecture === false;
                        const shouldOpenDoc = isExplicitDoc || !isVideoReady;

                        if (shouldOpenDoc) {
                            const fullUrl = attachment.url || (attachment.baseUrl + attachment.key);
                            if (fullUrl && fullUrl !== "undefined") {
                                window.open(fullUrl, "_blank");
                                return;
                            }
                        }
                    }

                    // 2. Video Playback Logic
                    if (urlType === "vimeo") {
                        if (isBefore) {
                            toast.error(`Upcoming class in ${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minutesLeft}m`);
                        } else {
                            router.push(`/watch?batchId=${batchId}&SubjectId=${subjectIdStr}&ChildId=${childId}&Type=vimeo&isLocked=false`);
                        }
                    } else if (urlType === "awsVideo") {
                      if (isDuring) {
                        router.push(`/live?batchId=${batchId}&SubjectId=${subjectIdStr}&ChildId=${childId}&Type=awsVideo`);
                      } else if (isAfter) {
                        router.push(`/watch?batchId=${batchId}&SubjectId=${subjectIdStr}&ChildId=${childId}&Type=penpencilvdo&isLocked=false`);
                      } else {
                        // isBefore
                        toast.error(`Upcoming live class in ${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minutesLeft}m`);
                      }
                    } else if (urlType === "penpencilvdo") {
                      router.push(`/watch?batchId=${batchId}&SubjectId=${subjectIdStr}&ChildId=${childId}&Type=penpencilvdo&isLocked=false`);
                    } else {
                        // Final fallback for anything with an attachment
                        if (attachment) {
                            const fullUrl = attachment.url || (attachment.baseUrl + attachment.key);
                            window.open(fullUrl, "_blank");
                        } else {
                            toast.error(isBefore ? "This class has not started yet." : "Content not available.");
                        }
                    }
                  };

                  return (
                    <LiveClassCard
                      key={cls._id}
                      teacherName={teacherName}
                      teacherImage={teacherImage}
                      subject={cls.subjectId?.name || "Subject"}
                      lectureTitle={cls.topic || cls.name || cls.videoDetails?.name || "Untitled"}
                      startTime={startTime ? startTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Document"}
                      tag={cls.tag || (cls.isVideoLecture === false ? "PDF" : "")}
                      onClick={handleClick}
                      priority={idx === 0}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              if (selectedClass.batchId) {
                router.push(`/study/batches/${selectedClass.batchId}`);
              } else {
                toast.error("You haven't enrolled in any batches!!");
              }
            }}
          >
            View All Classes
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Community Section */}
      <div className="bg-background border rounded-lg p-4 sm:p-6 mb-6 divshadow text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold">Join Our Community 🚀</h2>
            <p className="text-muted-foreground">
              Join our Telegram channel to receive the latest updates 📢 and batch information 📚
            </p>
          </div>
          <Button className="flex items-center gap-2 px-8" onClick={() => OpenTelegramChannel()}>
            Join Telegram Channel
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <PromotionPopup promotion={promotion} />
    </div>
  );
}
